import {asString} from "./logWrapper";
import axios, {AxiosInstance, AxiosResponse} from "axios";
import {SearchClient, SearchHit} from "../ui/search/types";
import {sleep, sleepUntilEpocSecond} from "../service/delay";
import {debug, info, trace, warn} from "tauri-plugin-log-api";

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
    trace(`Request: ${JSON.stringify(request, null, 2)}`)
    return request;
  })
  instance.interceptors.response.use((response) => {
    trace(`Response: ${JSON.stringify(response, null, 2)}`)
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
    info(`Searching for '${searchString}' with the github client`)
    const transformer = (codeItem: GithubSearchCodeItem) => {
      let owner = codeItem.repository.owner.login;
      let repo = codeItem.repository.name;
      return new SearchHit(
        this.searchHostKey,
        this.codeHostKey,
        owner,
        repo,
        this.sshCloneUrl(owner, repo),
        codeItem.repository.description
      );
    }
    return this.paginate('/search/code', max, {q: searchString}, transformer)
  }

  async paginate<GITHUB_TYPE, TYPE>(url: string, max: number, params: any, transformer: (data: GITHUB_TYPE) => TYPE): Promise<TYPE[]> {
    const aggregator: Set<TYPE> = new Set<TYPE>()
    let page = 1
    let attempt = 0
    pagination: while (aggregator.size < max) {
      await sleep(1000)
      debug(`Fetching page ${page} with ${aggregator.size} found already`)
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
          info('Resume after throttle')
          continue
        case "failed":
          warn(`Failed paginating request in a way that was not recoverable with throttling: ${response.status}::${JSON.stringify(response.data)}`)
          break pagination;
        case "ok":
          const data: GithubPage<GITHUB_TYPE> = response.data
          trace(`Got response from GitHub ${asString(data)}`)
          const mapped = data.items.map(transformer)
          for (const item of mapped) {
            aggregator.add(item);
            if(aggregator.size === max) break pagination;
          }
          if (data.items.length < 100) break pagination
          attempt = 0
          page++
      }
    }
    return Array.from(aggregator);
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
        warn(`Secondary rate limit hit ⚠️💥!!!`)
        await sleep(10_000)
        return "retryable"
      }
    }
    return "failed"
  }
}
