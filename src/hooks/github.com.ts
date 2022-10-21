import {asString, logDebug, logInfo, logTrace, logWarn} from "./logWrapper";
import axios, {AxiosInstance, AxiosResponse} from "axios";
import {SearchClient, SearchHit} from "../ui/search/types";
import {sleep, sleepUntilEpocSecond} from "../service/delay";

export interface GitHubClientWrapper {
  gitHubClient?: GithubClient;
  gitHubClientInitError?: string;
}

interface GithubPage<T> {
  total_count: number,
  incomplete_results: boolean,
  items: T[],
}

interface GithubOwner {
  login: string
}

interface GithubSearchCodeRepository {
  name: string,
  owner: GithubOwner,
  description?: string,
}

interface GithubSearchCodeItem {
  repository: GithubSearchCodeRepository
}


type ResponseStatus = 'ok' | 'retryable' | 'failed'

function axiosInstance(username: string, token: string, baseURL: string): AxiosInstance {
  const instance = axios.create({
    timeout: 10000,
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": 'application/json',
    },
    baseURL,
  })
  instance.interceptors.request.use((request) => {
    logTrace(`Request: ${JSON.stringify(request, null, 2)}`)
    return request;
  })
  instance.interceptors.response.use((response) => {
    logTrace(`Response: ${JSON.stringify(response, null, 2)}`)
    return response;
  })
  instance.defaults.validateStatus = function () {
    return true
  }
  return instance
}

export class GithubClient implements SearchClient {

  private readonly baseUrl: string;
  private readonly username: string;
  private readonly token: string;
  private readonly searchHostKey: string;
  private readonly codeHostKey: string;
  private readonly api: AxiosInstance;

  constructor(
    baseUrl: string,
    username: string,
    token: string,
    searchHostKey: string,
    codeHostKey: string,
  ) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.token = token;
    this.searchHostKey = searchHostKey;
    this.codeHostKey = codeHostKey;
    this.api = axiosInstance(username, token, baseUrl)
  }

  sshCloneUrl(owner: string, repo: string): string {
    return `git@github.com:${owner}/${repo}.git`;
  }

  httpsCloneUrl(owner: string, repo: string): string {
    return `https://github.com/${owner}/${repo}.git`
  }

  async searchCode(searchString: string, max: number): Promise<SearchHit[]> {
    const transformer = (codeItem: GithubSearchCodeItem) => {
      let owner = codeItem.repository.owner.login;
      let repo = codeItem.repository.name;
      return new SearchHit(
        this.searchHostKey,
        this.codeHostKey,
        owner,
        repo,
        this.sshCloneUrl(owner, repo),
        this.httpsCloneUrl(owner, repo),
        codeItem.repository.description
      );
    }
    return this.paginate('/search/code', max, {q: searchString}, transformer)
  }

  async paginate<GITHUB_TYPE, TYPE>(url: string, max: number, params: any, transformer: (data: GITHUB_TYPE) => TYPE): Promise<TYPE[]> {
    const aggregator: TYPE[] = []
    let page = 1
    let attempt = 0
    pagination: while (aggregator.length < max) {
      await sleep(1000)
      logDebug(`Fetching page ${page} with ${aggregator.length} found already`)
      const response = await this.api.get(url, {
        params: {
          ...params,
          page,
          per_page: 100,
        },
      })
      const status: ResponseStatus = await this.retryOnThrottle(attempt, response)
      switch (status) {
        case "retryable":
          attempt++
          logInfo('Resume after throttle')
          continue
        case "failed":
          logWarn(`Failed paginating request in a way that was not recoverable with throttling: ${response.status}::${JSON.stringify(response.data)}`)
          break pagination;
        case "ok":
          const data: GithubPage<GITHUB_TYPE> = response.data
          logTrace(`Got response from GitHub ${asString(data)}`)
          data.items.map(transformer).forEach((item) => aggregator.push(item))
          if (data.incomplete_results === false || data.items.length === 0) break pagination
          attempt = 0
          page++
      }
    }
    return aggregator;
  }

  async retryOnThrottle(attempt: number, response: AxiosResponse<any>): Promise<ResponseStatus> {
    if (response.status < 300) {
      return 'ok'
    }
    if (attempt > 3) {
      return "failed"
    }
    if (response.status === 403) {
      // Secondary rate limit
      const retryAfter = response.headers['Retry-After']
      if (retryAfter && +retryAfter > 0) {
        await sleep(+retryAfter * 1000)
        return "retryable"
      }
      // Primary rateLimit
      const xRatelimitRemaining = response.headers['x-ratelimit-remaining'];
      const xRatelimitReset = response.headers['x-ratelimit-reset'];
      if (xRatelimitReset && xRatelimitReset) {
        if (xRatelimitRemaining && xRatelimitRemaining === '0') {
          if (xRatelimitReset && +xRatelimitReset > 0) {
            await sleepUntilEpocSecond(+xRatelimitReset)
            return "retryable"
          }
        }
      }
      if (response.data?.message === 'You have exceeded a secondary rate limit. Please wait a few minutes before you try again.') {
        logWarn(`Secondary rate limit hit ⚠️💥!!!`)
        await sleep(10_000)
        return "retryable"
      }
    }
    return "failed"
  }
}
