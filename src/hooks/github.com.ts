import {asString} from "./logWrapper";
import axios, {AxiosInstance, AxiosResponse} from "axios";
import {SearchHit} from "../ui/search/types";
import {sleep, sleepUntilEpocSecond} from "../service/delay";
import {debug, info, trace, warn} from "tauri-plugin-log-api";
import {MegaSettingsType} from "./settings";
import {getCurrentBranchName, getMainBranchName} from "../service/file/cloneDir";
import {simpleActionWithResult, SimpleGitActionReturn} from "../service/file/simpleActionWithResult";
import {WorkMeta, WorkResultStatus} from "../service/types";

function githubRepoFetchGraphQl(repos: { owner: string, repo: string }[]): string {
  return `fragment repoProperties on Repository {
  sshUrl
  name
  description
  url
  owner {
    login
    avatarUrl
  }
  defaultBranchRef {
    name
  }
  allowUpdateBranch
}

{
  ${repos.map(({owner, repo}, index) => `  repo${index}: repository(owner: "${owner}", name: "${repo}") {
    ...repoProperties
  }`).join("\n")}
}`
}

const githubPullRequestGraphQLSearch = `query SearchPullRequests($query: String!, $cursor: String) {
  search(first: 100, type: ISSUE, query: $query, after: $cursor) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      __typename
      ... on PullRequest {
        author {
          avatarUrl
          login
        }
        repository {
          name
          owner {
            login
            avatarUrl
          }
          url
          sshUrl
        }
        url
        title
        body
        state
        mergedAt
      }
    }
  }
}`

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

interface GithubUser {
  login: string,
  avatarUrl?: string,
}

export interface GitHubPull {
  owner?: GithubUser,
  repo?: string,
  title: string,
  body?: string,
  repositoryUrl: string,
  cloneUrl: string,
  htmlUrl: string,
  state: string,
  author?: GithubUser,
  mergedAt?: string,
  raw: any,
}

interface GitHubPullRequestInput {
  hits: SearchHit[];
  title: string;
  body: string;
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

export class GithubClient {

  private readonly baseUrl: string;
  readonly username: string;
  private readonly token: string;
  private readonly searchHostKey: string;
  private readonly codeHostKey: string;
  private readonly api: AxiosInstance;
  private readonly settings: MegaSettingsType;

  constructor(
    baseUrl: string,
    username: string,
    token: string,
    searchHostKey: string,
    codeHostKey: string,
    settings: MegaSettingsType,
  ) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.token = token;
    this.searchHostKey = searchHostKey;
    this.codeHostKey = codeHostKey;
    this.settings = settings;
    this.api = axiosInstance(username, token, baseUrl)
  }

  sshCloneUrl(owner: string, repo: string): string {
    return `git@github.com:${owner}/${repo}.git`;
  }

  httpsCloneUrl(owner: string, repo: string): string {
    return `https://github.com/${owner}/${repo}.git`
  }

  async searchCode(searchString: string, max: number): Promise<SearchHit[]> {
    info(`Searching for REPO '${searchString}' with the github client`)
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

  async searchRepo(searchString: string, max: number): Promise<SearchHit[]> {
    info(`Searching for REPO: '${searchString}' with the github client`)
    const transformer = (repository: GithubSearchCodeRepository) => {
      let owner = repository.owner.login;
      let repo = repository.name;
      return new SearchHit(
        this.searchHostKey,
        this.codeHostKey,
        owner,
        repo,
        this.sshCloneUrl(owner, repo),
        repository.description
      );
    }
    return this.paginate('/search/repositories', max, {q: searchString}, transformer)
  }

  async searchPulls(searchString: string, max: number): Promise<GitHubPull[]> {
    info(`Searching for PULLS: '${searchString}' with the github client`)
    const transformer: (item: any) => GitHubPull = (item: any) => {
      return {
        owner: item.repository.owner,
        repo: item.repository.name,
        author: item.author,
        body: item.body,
        title: item.title,
        htmlUrl: item.url,
        mergedAt: item.mergedAt,
        state: item.state,
        repositoryUrl: item.repository.url,
        cloneUrl: item.repository.sshUrl,
        raw: item
      };
    }
    return this.paginateGraphQl(
      '/graphql',
      max,
      githubPullRequestGraphQLSearch,
      {query: searchString},
      (data) => data.data.search.nodes,
      transformer,
    );
  }

  createPullRequests(input: GitHubPullRequestInput, progressCallback: (done: number) => void): Promise<SimpleGitActionReturn> {
    progressCallback(0)
    return simpleActionWithResult({
      ...input,
      settings: this.settings,
      sourceString: 'Create pullRequests',
      workResultKind: "gitStage",
    }, async (index: number, hit: SearchHit, path: string, meta: WorkMeta, statusReport: (sts: WorkResultStatus) => void) => {
      try {
        const main = await getMainBranchName(path, meta)
        const head = await getCurrentBranchName(path)
        await this.createPullRequest(hit, input.title, input.body, head, main, meta)
        statusReport('ok')
      } catch (e) {
        statusReport('failed')
      } finally {
        progressCallback(index + 1)
      }
    })
  }

  private async createPullRequest(hit: SearchHit, title: string, body: string, head: string, base: string, meta: WorkMeta) {
    let attempt = 0;
    outer_loop: while (true) {
      await sleep(1000)
      const response = await this.api.post(`${this.baseUrl}/repos/${hit.owner}/${hit.repo}/pulls`, {
        title,
        body,
        head,
        base,
      }, {})
      const retryStatus = await this.retryOnThrottle(attempt, response);
      meta.workLog.push({
        status: retryStatus === "ok" ? "ok" : "failed",
        result: response,
        what: 'POST Create PullRequest',
      })
      switch (retryStatus) {
        case "ok":
          info('Created PullRequest')
          break outer_loop;
        case "retryable":
          debug('Failed creating PullRequest, will retry in a sec')
          break;
        case "failed":
          throw new Error('Giving up on creating pull request')
      }
      attempt++;
    }
  }

  private async paginateGraphQl<GITHUB_TYPE, TYPE>(
    url: string,
    max: number,
    query: string,
    variables: any,
    listExtractor: (data: any) => GITHUB_TYPE[],
    transformer: (data: GITHUB_TYPE) => TYPE
  ): Promise<TYPE[]> {
    let cursor: string | undefined = undefined;
    const aggregator: Set<TYPE> = new Set<TYPE>()
    let attempt = 0;
    pagination: while (aggregator.size < max) {
      await sleep(1000)
      const response: AxiosResponse = await this.api.post(url, {
        variables: {
          ...variables,
          cursor: cursor,
        },
        query,
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
          const data: GITHUB_TYPE[] = listExtractor(response.data)
          trace(`Got response from GitHub ${asString(data)}`)
          const mapped = data.map(transformer)
          for (const item of mapped) {
            aggregator.add(item);
            if (aggregator.size === max) break pagination;
          }
          attempt = 0
          if (response.data.data.search.pageInfo.hasNextPage && response.data.data.search.pageInfo.endCursor) {
            cursor = response.data.data.search.pageInfo.endCursor
          } else {
            break pagination;
          }
      }
    }
    return Array.from(aggregator);
  }

  private async paginate<GITHUB_TYPE, TYPE>(url: string, max: number, params: any, transformer: (data: GITHUB_TYPE) => TYPE): Promise<TYPE[]> {
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
      trace('Received response: ' + asString(response))
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
            if (aggregator.size === max) break pagination;
          }
          if (data.items.length < 100) break pagination
          attempt = 0
          page++
      }
    }
    return Array.from(aggregator);
  }

  private async retryOnThrottle(attempt: number, response: AxiosResponse<any>): Promise<ResponseStatus> {
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
