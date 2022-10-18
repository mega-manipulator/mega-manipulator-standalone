import {logError, logInfo, logTrace, logWarn} from "./logWrapper";
import {useMemo} from "react";
import {usePassword} from "./usePassword";
import axios, {AxiosInstance, AxiosResponse} from "axios";
import {SearchHit} from "../ui/search/types";
import {useMegaSettings} from "./useMegaSettings";

const sleepUntilEpocSecond = (epocSecond: number) => {
  const now = (new Date()).getDate()
  const time = Math.max(0, (epocSecond * 1000 - now))
  return sleep(time)
}
const sleep = (ms: number) => new Promise((r) => {
  logInfo(`Going to sleep for ${ms}ms`)
  return setTimeout(r, ms)
});

export interface GitHubClientWrapper {
  gitHubClient?: GithubClient;
  gitHubClientInitError?: string;
}

export const useGithubClient: (searchHostKey?: string) => GitHubClientWrapper = (searchHostKey?: string) => {
  return useMemo(() => {
    try {
      if (searchHostKey === undefined){
        return {gitHubClientInitError: 'No search host key set'}
      }
      const megaSettings = useMegaSettings()
      const githubSettings = megaSettings.searchHosts[searchHostKey]?.github;
      if (githubSettings === undefined) {
        let msg = `Settings unresolvable for '${searchHostKey}'`;
        logWarn(msg)
        return {gitHubClientInitError: msg}
      }
      const username: string | undefined = githubSettings?.username;
      if (username === undefined) {
        let msg = `No username set for '${searchHostKey}'`;
        logWarn(msg)
        return {gitHubClientInitError: msg}
      }
      const baseUrl = githubSettings.baseUrl
      const [password, setPassword]: [(string | undefined), ((password: string) => void)] = usePassword(username, baseUrl)
      if (password === undefined) {
        let message = `Password not set for '${searchHostKey}'`;
        logWarn(message)
        return {gitHubClientInitError: message}
      }

      return ({
        gitHubClient: new GithubClient(githubSettings.baseUrl, username, password, searchHostKey, githubSettings.codeHostKey),
      })
    } catch (e: unknown) {
      const msg: string = typeof e === 'object' ? JSON.stringify(e) : typeof e === 'string' ? e : typeof e
      logError('Failed setting up GitHub client due to: ' + msg)
      return {gitHubClientInitError: msg}
    }
  },[searchHostKey])
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
    (async () => {
      logTrace(`Request: ${JSON.stringify(request, null, 2)}`)
      await sleep(1_000)
    })()
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

export class GithubClient {

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

  async searchCode(searchString: string, max: number): Promise<SearchHit[]> {
    const transformer = (codeItem: GithubSearchCodeItem) => new SearchHit(this.searchHostKey, this.codeHostKey, codeItem.repository.owner.login, codeItem.repository.name, codeItem.repository.description)
    return this.paginate('/search/code', max, {q: searchString}, transformer)
  }

  async paginate<GITHUB_TYPE, TYPE>(url: string, max: number, params: any, transformer: (data: GITHUB_TYPE) => TYPE): Promise<TYPE[]> {
    const aggregator: TYPE[] = []
    let page = 1
    let attempt = 0
    pagination: while (aggregator.length < max) {
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
          attempt = 0
          page++
          const data: GithubPage<GITHUB_TYPE> = response.data
          data.items.map(transformer).forEach((item) => aggregator.push(item))
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
        await sleep(10_000)
        logWarn(`Ooops, this should have been recoverable!!!: ${JSON.stringify(response)}`)
        return "retryable"
      }
    }
    return "failed"
  }
}
