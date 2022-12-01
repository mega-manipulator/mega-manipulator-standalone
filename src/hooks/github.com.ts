import {asString} from "./logWrapper";
import axios, {AxiosInstance, AxiosResponse} from "axios";
import {SearchHit} from "../ui/search/types";
import {sleep, sleepUntilEpocSecond} from "../service/delay";
import {debug, info, trace, warn} from "tauri-plugin-log-api";
import {MegaSettingsType} from "./settings";
import {getCurrentBranchName, getMainBranchName} from "../service/file/cloneDir";
import {simpleActionWithResult, SimpleGitActionReturn} from "../service/file/simpleActionWithResult";
import {WorkMeta, WorkResult, WorkResultKind, WorkResultStatus} from "../service/types";
import {saveResultToStorage} from "../service/work/workLog";

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

function githubPullMarkReadyGraphql(pull: GitHubPull[]): string {
  return `mutation {
${pull.map(({prId}, index) => `  pull${index}: markPullRequestReadyForReview(input:{pullRequestId:"${prId}"})`).join("\n")}
}`
}

function githubPullMarkDraftGraphql(pull: GitHubPull[]): string {
  return `mutation {
${pull.map(({prId}, index) => `  pull${index}: convertPullRequestToDraft(input:{pullRequestId:"${prId}"})`).join("\n")}
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
        id
        number
        headRef {
          name
        }
        baseRef {
          name
        }
        author {
          avatarUrl
          login
        }
        repository {
          name
          viewerDefaultMergeMethod
          rebaseMergeAllowed
          squashMergeAllowed
          mergeCommitAllowed
          defaultBranchRef{
            name
          }
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
        isDraft
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

export type GithubMergeMethodResponse = 'SQUASH' | 'MERGE' | 'REBASE'
export type GithubMergeMethodRequest = 'squash' | 'merge' | 'rebase'

export interface GitHubPull {
  codeHostKey: string,
  prId: string,
  prNumber: number,
  owner: GithubUser,
  repoDefaultBranch: string,
  merge: {
    defaultMergeMethod: GithubMergeMethodResponse,
    rebaseMergeAllowed: boolean,
    squashMergeAllowed: boolean,
    mergeCommitAllowed: boolean,
  }
  head?: string,
  base: string,
  repo: string,
  title: string,
  body?: string,
  draft: boolean,
  repositoryUrl: string,
  cloneUrl: string,
  htmlUrl: string,
  state: string,
  author?: GithubUser,
  mergedAt?: string,
  raw: unknown,
}

function resoleMergeMethod(preferedMergeMethod: GithubMergeMethodResponse | undefined, pr: GitHubPull): GithubMergeMethodRequest {
  let defaultRequest: GithubMergeMethodRequest;
  switch (pr.merge.defaultMergeMethod) {
    case "SQUASH":
      defaultRequest = 'squash';
      break;
    case "MERGE":
      defaultRequest = 'merge';
      break;
    case "REBASE":
      defaultRequest = 'rebase';
      break;
  }
  if (!preferedMergeMethod) {
    return defaultRequest
  }
  switch (preferedMergeMethod) {
    case "SQUASH":
      return pr.merge.squashMergeAllowed ? "squash" : defaultRequest
    case "MERGE":
      return pr.merge.mergeCommitAllowed ? "merge" : defaultRequest
    case "REBASE":
      return pr.merge.rebaseMergeAllowed ? "rebase" : defaultRequest
  }
}

interface GithubPullRequestWorkInput {
  name: string,
  kind: WorkResultKind,
  pulls: GitHubPull[],
}

function newPullRequestWorkResult<T extends GithubPullRequestWorkInput>(input: T): WorkResult<T, GitHubPull, WorkMeta> {
  const time = new Date().getTime();
  const meta: WorkMeta = {
    workLog: [],
  }
  return {
    time,
    input,
    status: "in-progress",
    kind: input.kind,
    name: input.name,
    result: input.pulls.map((i) => ({
      input: i,
      output: {
        status: "in-progress",
        meta,
      }
    }))
  }
}

async function processPullRequests<T extends GithubPullRequestWorkInput, U>(
  input: T,
  action: (pr: GitHubPull, idx: number, meta: WorkMeta) => Promise<AxiosResponse<U>>,
): Promise<WorkResult<T, GitHubPull, WorkMeta>> {
  const workResult: WorkResult<T, GitHubPull, WorkMeta> = newPullRequestWorkResult(input)
  for (let i = 0; i < workResult.result.length; i++) {
    const pr: GitHubPull = workResult.result[i].input;
    let meta: WorkMeta | undefined = workResult.result[i].output.meta;
    if (!meta) {
      meta = {
        workLog: []
      };
      workResult.result[i].output.meta = meta;
    }
    try {
      debug(`${input.name} ${pr.htmlUrl}`)
      await action(pr, i, meta)
      workResult.result[i].output.status = "ok"
    } catch (e) {
      workResult.result[i].output.status = "failed"
    }
  }
  const anyNotOk: boolean = workResult.result.some((r) => r.output.status !== 'ok')
  workResult.status = anyNotOk ? "failed" : "ok"
  await saveResultToStorage(workResult)
  return workResult
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
      const owner = codeItem.repository.owner.login;
      const repo = codeItem.repository.name;
      return ({
        searchHost: this.searchHostKey,
        codeHost: this.codeHostKey,
        owner: owner,
        repo: repo,
        sshClone: this.sshCloneUrl(owner, repo),
        description: codeItem.repository.description,
      });
    }
    return this.paginate('/search/code', max, {q: searchString}, transformer)
  }

  async searchRepo(searchString: string, max: number): Promise<SearchHit[]> {
    info(`Searching for REPO: '${searchString}' with the github client`)
    const transformer = (repository: GithubSearchCodeRepository) => {
      const owner = repository.owner.login;
      const repo = repository.name;
      return ({
        searchHost: this.searchHostKey,
        codeHost: this.codeHostKey,
        owner: owner,
        repo: repo,
        sshClone: this.sshCloneUrl(owner, repo),
        description: repository.description,
      });
    }
    return this.paginate('/search/repositories', max, {q: searchString}, transformer)
  }

  async searchPulls(searchString: string, max: number): Promise<GitHubPull[]> {
    info(`Searching for PULLS: '${searchString}' with the github client`)
    const transformer: (item: any) => GitHubPull = (item: any) => {
      //debug(`PR: ${asString(item)}`)
      return {
        codeHostKey: this.codeHostKey,
        prId: item.id,
        prNumber: item.number,
        owner: item.repository.owner,
        repo: item.repository.name,
        merge: {
          defaultMergeMethod: item.repository.viewerDefaultMergeMethod,
          mergeCommitAllowed: item.repository.mergeCommitAllowed,
          rebaseMergeAllowed: item.repository.rebaseMergeAllowed,
          squashMergeAllowed: item.repository.squashMergeAllowed,
        },
        author: item.author,
        body: item.body,
        title: item.title,
        draft: item.isDraft,
        htmlUrl: item.url,
        mergedAt: item.mergedAt,
        state: item.state,
        repositoryUrl: item.repository.url,
        cloneUrl: item.repository.sshUrl,
        head: item.headRef?.name,
        base: item.baseRef.name,
        repoDefaultBranch: item.repository.defaultBranchRef.name,
        raw: item,
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

  async prReadyForReview(
    input: { prs: GitHubPull[] },
    progressCallback: (idx: number) => void,
  ): Promise<WorkResult<unknown, GitHubPull, WorkMeta>> {
    const body = githubPullMarkReadyGraphql(input.prs)
    const workResult: WorkResult<unknown, GitHubPull, WorkMeta> = newPullRequestWorkResult({
      name: 'Mark pull requests ready',
      kind: 'prDraftReady',
      pulls: input.prs,
    })
    const meta: WorkMeta = {
      workLog: []
    }
    workResult.status = "in-progress"
    workResult.result.push({
      input: input.prs[0],
      output: {
        meta,
        status: "in-progress"
      },
    })
    try {
      const resp = await this.evalRequest('Mark pull requests ready', meta, () => this.api.post('/graphql', {
        query: body
      }))
      if (resp.status < 300) {
        for (let i = 0; i < input.prs.length; i++) {
          // TODO sift through result
        }
        workResult.status = "ok"
      } else {
        workResult.status = "failed"
      }
    } catch (e) {
      meta.workLog.push({
        what: 'GraphQL request',
        status: "failed",
        result: e,
      })
      workResult.status = "failed"
    }
    return workResult
  }

  async reviewPullRequests(
    input: { prs: GitHubPull[], body: { body: string, event: 'REQUEST_CHANGES' | 'APPROVE' } },
    progressCallback: (idx: number) => void
  ): Promise<WorkResult<unknown, GitHubPull, WorkMeta>> {
    return await processPullRequests({
      pulls: input.prs,
      name: 'Review Pull request',
      kind: 'reviewPr'
    }, (pr, idx, meta) => {
      progressCallback(idx)
      return this.evalRequest('Review PullRequest', meta, async () => {
        await sleep(1000);
        return await this.api.post(`/repos/${pr.owner?.login}/${pr.repo}/pulls/${pr.prNumber}/reviews`, input.body, {})
      })
    })
  }

  async mergePullRequests(
    input: {
      prs: GitHubPull[],
      mergeStrategy: GithubMergeMethodResponse | undefined
      title?: string,
      message?: string,
      dropBranch: boolean,
    },
    progressCallback: (idx: number) => void,
  ): Promise<WorkResult<unknown, GitHubPull, WorkMeta>> {
    return await processPullRequests({
      pulls: input.prs,
      name: 'Merge Pull request',
      kind: 'mergePr'
    }, async (pr: GitHubPull, idx, meta) => {
      progressCallback(idx)
      const method: GithubMergeMethodRequest = resoleMergeMethod(input.mergeStrategy, pr)

      const mergeResult = await this.evalRequest('Merge PullRequest', meta, async () => {
        await sleep(1000);
        return await this.api.put(`/repos/${pr.owner?.login}/${pr.repo}/pulls/${pr.prNumber}/merge`, {
          merge_method: method,
          commit_title: input.title,
          commit_message: input.message,
        }, {})
      })
      if (mergeResult.status < 300 && input.dropBranch) {
        return this.evalRequest('Drop branch', meta, async () => {
          await sleep(1000)
          return await this.dropPrBranch(pr, meta)
        })
      } else {
        return mergeResult
      }
    })
  }

  async closePullRequests(input: { prs: GitHubPull[], comment: string, dropBranch: boolean }, progressCallback: (idx: number) => void): Promise<WorkResult<any, GitHubPull, WorkMeta>> {
    return await this.patchPullRequests({...input, body: {state: "closed"}}, progressCallback);
  }

  async reOpenPullRequests(
    input: { prs: GitHubPull[], comment?: string },
    progressCallback: (idx: number) => void
  ): Promise<WorkResult<unknown, GitHubPull, WorkMeta>> {
    return await this.patchPullRequests({...input, body: {state: "open"}}, progressCallback);
  }

  async rewordPullRequests(input: { prs: GitHubPull[], body: { title: string, body: string } }, progressCallback: (idx: number) => void): Promise<WorkResult<any, GitHubPull, WorkMeta>> {
    return await this.patchPullRequests(input, progressCallback);
  }

  private async patchPullRequests(input: { prs: GitHubPull[], comment?: string, dropBranch?: boolean, body: any }, progressCallback: (idx: number) => void): Promise<WorkResult<any, GitHubPull, WorkMeta>> {
    return await processPullRequests({pulls: input.prs, name: 'Edit PRS', kind: "editPr"}, async (pr, idx, meta) => {
        progressCallback(idx)
        const result = await this.evalRequest('PATCH PullRequest', meta, async () => {
          await sleep(1000);
          return await this.api.patch(`/repos/${pr.owner?.login}/${pr.repo}/pulls/${pr.prNumber}`, input.body, {})
        })
        if (result.status === 200 && input.comment) {
          await this.commentPr(pr, input.comment, meta)
        }
        if (result.status === 200 && input.dropBranch === true) {
          await this.dropPrBranch(pr, meta)
        }
        return result
      }
    )
  }

  private async dropPrBranch(pr: GitHubPull, meta: WorkMeta): Promise<AxiosResponse<unknown, undefined>> {
    return await this.evalRequest('Drop PullRequest branch', meta, async () => {
      if (pr.head === pr.repoDefaultBranch) {
        throw new Error('Wont even try to delete the repo default branch 🤦')
      }
      await sleep(1000)
      return await this.evalRequest('Delete PullRequest branch', meta, async () => {
        await sleep(1000)
        return await this.api.delete(`/repos/${pr.owner?.login}/${pr.repo}/git/refs/heads/${pr.head}`)
      });
    });
  }

  private async commentPr(pr: GitHubPull, comment: string, meta: WorkMeta) {
    await this.evalRequest('Comment PullRequest', meta, async () => {
      await sleep(1000)
      return await this.api.post(`/repos/${pr.owner?.login}/${pr.repo}/issues/${pr.prNumber}/comments`, {body: comment}, {})
    });
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
    await this.evalRequest('POST Create PullRequest', meta, async () => {
      await sleep(1000)
      return await this.api.post(`/repos/${hit.owner}/${hit.repo}/pulls`, {
        title,
        body,
        head,
        base,
      }, {})
    })
  }

  private async evalRequest<T>(what: string, meta: WorkMeta | undefined, req: () => Promise<AxiosResponse<T>>): Promise<AxiosResponse<T>> {
    let attempt = 0;
    const maxTries = 10;
    while (attempt < maxTries) {
      const response: AxiosResponse<T> = await req()
      debug(`${what} ResponseStatus: ${response.status}`)
      if (response.status > 299) {
        debug(`ResponseData: ${asString(response.data)}`)
      }
      const retryStatus = await this.retryOnThrottle(attempt, response);
      if (meta) {
        meta.workLog.push({
          status: retryStatus === "ok" ? "ok" : "failed",
          result: response,
          what,
        })
      }
      switch (retryStatus) {
        case "ok":
          info(`Success '${what}'`)
          return response;
        case "retryable":
          debug(`Failed '${what}', will retry in a sec`)
          break;
        case "failed":
          throw new Error(`Giving up on creating '${what}'`)
      }
      attempt++;
    }
    throw new Error(`Giving up on creating '${what}' after ${maxTries} attempts`)
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
        case "ok": {
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
        case "ok": {
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
