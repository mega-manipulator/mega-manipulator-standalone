import {asString} from "./logWrapper";
import axios, {AxiosInstance, AxiosResponse} from "axios";
import {SearchHit} from "../ui/search/types";
import {sleep, sleepUntilEpocSecond} from "../service/delay";
import {debug, info, trace, warn} from "tauri-plugin-log-api";
import {MegaSettingsType} from "./settings";
import {getCurrentBranchName, getMainBranchName} from "../service/file/cloneDir";
import {SimpleActionReturn, simpleActionWithResult} from "../service/file/simpleActionWithResult";
import {WorkMeta, WorkResult, WorkResultKind, WorkResultOutput, WorkResultStatus} from "../service/types";
import {saveResultToStorage} from "../service/work/workLog";
import React from "react";

// @ts-ignore
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
${pull.map(({prId}, index) => `  pull${index}: markPullRequestReadyForReview(input:{pullRequestId:"${prId}"}) { clientMutationId }`).join("\n")}
}`
}

function githubPullMarkDraftGraphql(pull: GitHubPull[]): string {
  return `mutation {
${pull.map(({prId}, index) => `  pull${index}: convertPullRequestToDraft(input:{pullRequestId:"${prId}"}) { clientMutationId }`).join("\n")}
}`
}

const githubPullRequestGraphQLSearch = (getChecks: boolean) => `query SearchPullRequests($max: Int!, $query: String!, $cursor: String) {
  search(first: $max, type: ISSUE, query: $query, after: $cursor) {
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
        reviewDecision ${getChecks ? `
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
                contexts(first:25) {
                  nodes {
                    __typename
                    ... on CheckRun {
                      name
                      status
                      conclusion
                    }
                  }
                }
              }
            }
          }
        }
` : ''}
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

export interface GithubUser {
  login: string,
  avatarUrl?: string,
}

export type GithubMergeMethodResponse = 'SQUASH' | 'MERGE' | 'REBASE'
export type GithubMergeMethodRequest = 'squash' | 'merge' | 'rebase'

export type GithubPrCheck = {
  name: string,
  status: string,
  conclusion?: string,
}

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
  reviewDecision?: string,
  statusCheckRollup?: string,
  checks?: GithubPrCheck[]
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

function axiosInstance(_username: string, token: string, baseURL: string): AxiosInstance {
  const instance = axios.create({
    timeout: 60000,
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

  readonly username: string;
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
    this.username = username;
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

  private searchHitEquals(hit1: SearchHit, hit2: SearchHit): boolean {
    if (hit1 === undefined && hit2 === undefined) {
      return true;
    } else if (hit1 === undefined) {
      return false;
    } else if (hit2 === undefined) {
      return false;
    } else {
      return hit1.repo === hit2.repo && hit1.owner === hit2.owner;
    }
  }

  async searchCode(
    searchString: string,
    max: number,
    progress: (size: number) => void,
    searchRef: React.MutableRefObject<number>,
  ): Promise<SearchHit[]> {
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
    return this.paginate('/search/code', max, {q: searchString}, progress, transformer, this.searchHitEquals, searchRef)
  }

  async searchRepo(
    searchString: string,
    max: number,
    progress: (size: number) => void,
    searchRef: React.MutableRefObject<number>,
  ): Promise<SearchHit[]> {
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
    return this.paginate('/search/repositories', max, {q: searchString}, progress, transformer, this.searchHitEquals, searchRef)
  }

  async searchPulls(searchString: string, checks: boolean, max: number, progress: (size: number) => void): Promise<GitHubPull[]> {
    info(`Searching for PULLS: '${searchString}' with the github client`)
    const transformer: (item: any) => GitHubPull | undefined = (item: any) => {
      //debug(`PR: ${asString(item)}`)
      try {
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
          reviewDecision: item.reviewDecision,
          statusCheckRollup: item.commits?.nodes[0]?.commit?.statusCheckRollup?.state,
          checks: item.commits?.nodes[0]?.commit?.statusCheckRollup?.contexts?.nodes?.filter((c: any) => c && c.name && c.status)
        };
      } catch (e) {
        warn(`Was unable to map returned PR item correctly. Error was ${asString(e)} and the item was ${asString(item)}`)
        return undefined
      }
    }
    return this.paginateGraphQl(
      '/graphql',
      max,
      githubPullRequestGraphQLSearch(checks),
      {query: searchString},
      progress,
      (data) => data.data.search.nodes,
      transformer,
    );
  }

  async prDraftOrReadyForReview(
    input: { prs: GitHubPull[], draft: boolean },
    progressCallback: (idx: number) => void,
  ): Promise<WorkResult<unknown, GitHubPull, WorkMeta>> {
    progressCallback(0)
    const body = input.draft ? githubPullMarkDraftGraphql(input.prs) : githubPullMarkReadyGraphql(input.prs)
    const name = 'Mark pull requests ' + input.draft ? 'draft' : 'ready';
    const workResult: WorkResult<unknown, GitHubPull, WorkMeta> = newPullRequestWorkResult({
      name: name,
      kind: input.draft ? 'prDraftMark' : 'prDraftReady',
      pulls: input.prs,
    })
    const meta: WorkMeta = {
      workLog: []
    }
    const output: WorkResultOutput<WorkMeta> = {
      meta,
      status: "in-progress",
    }
    workResult.status = "in-progress"
    workResult.result = input.prs.map((p) => ({
      input: p,
      output,
    }))
    try {
      const resp = await this.evalRequest(name, meta, () => this.api.post('/graphql', {
        query: body
      }))
      if (resp.status < 300) {
        workResult.status = "ok"
      } else {
        workResult.status = "failed"
      }
    } catch (e) {
      workResult.result[0]?.output?.meta?.workLog?.push({
        what: 'GraphQL request',
        status: "failed",
        result: e,
      })
      workResult.status = "failed"
    }
    progressCallback(input.prs.length)
    await saveResultToStorage(workResult)
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

  async closePullRequests(input: { prs: GitHubPull[], comment?: string, dropBranch: boolean }, progressCallback: (idx: number) => void): Promise<WorkResult<any, GitHubPull, WorkMeta>> {
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
        if (result.status === 200) {
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

  private async commentPr(pr: GitHubPull, comment: string | undefined, meta: WorkMeta) {
    if (comment && comment.length !== 0) {
      await this.evalRequest('Comment PullRequest', meta, async () => {
        await sleep(1000)
        return await this.api.post(`/repos/${pr.owner?.login}/${pr.repo}/issues/${pr.prNumber}/comments`, {body: comment}, {})
      });
    }
  }

  createPullRequests(input: GitHubPullRequestInput, progressCallback: (done: number) => void): Promise<SimpleActionReturn> {
    progressCallback(0)
    return simpleActionWithResult({
      ...input,
      progress: (idx: number) => progressCallback(idx),
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
    progress: (size: number) => void,
    listExtractor: (data: any) => GITHUB_TYPE[],
    transformer: (data: GITHUB_TYPE) => TYPE | undefined
  ): Promise<TYPE[]> {
    let cursor: string | undefined = undefined;
    const aggregator: Set<TYPE> = new Set<TYPE>()
    let attempt = 0;
    progress(0)
    pagination: while (aggregator.size < max) {
      progress(aggregator.size)
      await sleep(1000)
      const left = max - aggregator.size
      const response: AxiosResponse = await this.api.post(url, {
        variables: {
          ...variables,
          cursor: cursor,
          max: Math.min(25, left)
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
          const mapped: TYPE[] = data.map(transformer).filter((i) => i !== undefined).map((i) => i as TYPE)
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
    progress(aggregator.size)
    return Array.from(aggregator);
  }

  private async paginate<GITHUB_TYPE, TYPE>(
    url: string,
    max: number,
    params: any,
    progress: (size: number) => void,
    transformer: (data: GITHUB_TYPE) => TYPE,
    equality: (v1: TYPE, v2: TYPE) => boolean,
    searchRef: React.MutableRefObject<number>,
  ): Promise<TYPE[]> {
    const fixedSearchRef = searchRef.current;
    const aggregator: Set<TYPE> = new Set<TYPE>()
    let page = 1;
    const per_page = 25;
    let attempt = 0;
    progress(0);
    pagination: while (aggregator.size < max && fixedSearchRef == searchRef.current) {
      progress(aggregator.size)
      await sleep(1000);
      debug(`Fetching page ${page} with ${aggregator.size} found already`);
      const response = await this.api.get(url, {
        params: {
          ...params,
          page,
          per_page,
        },
      });
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
          mapp: for (const item of mapped) {
            for (const present of aggregator) {
              if (equality(present, item))
                continue mapp;
            }
            aggregator.add(item);
            if (aggregator.size === max) break pagination;
          }
          if (data.items.length < per_page) break pagination
          attempt = 0
          page++
        }
      }
    }
    progress(aggregator.size)
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
