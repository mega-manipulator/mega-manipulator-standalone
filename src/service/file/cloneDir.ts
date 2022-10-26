import {fs, path} from "@tauri-apps/api";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {asString} from "../../hooks/logWrapper";
import {debug, error, trace, warn} from "tauri-plugin-log-api";
import {ChildProcess, Command} from "@tauri-apps/api/shell";

export async function listClones(settings: MegaSettingsType): Promise<string[]> {
  trace('listClones')
  if (!settings.clonePath) {
    warn('listClones bailed, no clonePath in settings')
    return [];
  }
  try {
    return await listClonesRecursive(0, settings.clonePath)
  } catch (e) {
    error('listClones encountered an exception: ' + asString(e))
    return []
  }
}

async function listClonesRecursive(depth: number, path: string): Promise<string[]> {
  const dir = await fs.readDir(path)
  if (depth === 4) {
    if (dir.some(f => f.name === '.git')) {
      trace(`Here I am at path ${path}`)
      return [path]
    } else {
      trace(`Here I am at path ${path} WITHOUT a .GIT`)
      return []
    }
  } else {
    const aggregate: string[] = []
    for (const fileEntry of dir) {
      if (fileEntry.children) {
        const atLevel = await listClonesRecursive(depth + 1, fileEntry.path)
        aggregate.push(...atLevel)
      }
    }
    return aggregate
  }
}

export type ReportSate = 'good' | 'bad' | 'loading' | 'failed to execute'

export class RepoBadStatesReport {
  readonly repoPath: string;
  readonly uncommittedChanges: ReportSate = 'loading';
  readonly onDefaultBranch: ReportSate = 'loading';
  readonly noDiffWithOriginHead: ReportSate = 'loading';
  readonly noSearchHostConfig: ReportSate = 'loading';
  readonly noCodeHostConfig: ReportSate = 'loading';

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }
}

export async function analyzeRepoForBadStates(settings: MegaSettingsType, repoPath: string): Promise<RepoBadStatesReport> {
  const trimmedRepoPath = repoPath.substring((settings.clonePath?.length ?? -1) + 1)
  try {
    const [uncommittedChanges, onDefaultBranch, noDiffWithOriginHead] = await Promise.all([hasUncommittedChanges(repoPath), hasOnDefaultBranch(repoPath), hasNoDiffWithOriginHead(repoPath)])
    const codeHostPath = await path.resolve(repoPath, '..', '..')
    const codeHostDirName = await path.basename(codeHostPath)
    const searchHostDirName = await path.basename(await path.dirname(codeHostPath))

    const noSearchHostConfig = settings.searchHosts[searchHostDirName] !== undefined ? 'good' : 'bad';
    if(noSearchHostConfig === 'bad'){
      debug('searchHostDirName does not have matching searchHostConfig: '+searchHostDirName)
    }
    const noCodeHostConfig = settings.codeHosts[codeHostDirName] != undefined ? 'good' : 'bad';
    if (noCodeHostConfig === 'bad') {
      debug('codeHostDirName does not have matching codeHostConfig: '+codeHostDirName)
    }

    return {
      repoPath: trimmedRepoPath,
      uncommittedChanges,
      onDefaultBranch,
      noDiffWithOriginHead,
      noSearchHostConfig,
      noCodeHostConfig,
    };
  } catch (e) {
    error('Failed to execute: ' + asString(e))
    return {
      repoPath: trimmedRepoPath,
      uncommittedChanges: "failed to execute",
      onDefaultBranch: "failed to execute",
      noDiffWithOriginHead: "failed to execute",
      noSearchHostConfig: "failed to execute",
      noCodeHostConfig: "failed to execute",
    }
  }
}

async function hasUncommittedChanges(repoPath: string): Promise<ReportSate> {
  const result = await new Command('git', ['diff'], {cwd: repoPath}).execute()
  debug(`Ran 'git diff' in ${repoPath} with result: ${asString(result)}`)
  if (result.code !== 0) return "failed to execute"
  else if (result.stdout.length === 0 && result.stderr.length === 0) return "good"
  else return "bad"
}

async function hasOnDefaultBranch(repoPath: string): Promise<ReportSate> {
  try {
    const [current, main] = await Promise.all([
      getCurrentBranchName(repoPath),
      getMainBranchName(repoPath),
    ])
    return current === main ? 'bad' : 'good';
  } catch (e) {
    error('Failed to get #hasOnDefaultBranch: ' + asString(e))
    return 'failed to execute'
  }
}

async function hasNoDiffWithOriginHead(repoPath: string): Promise<ReportSate> {
  try {
    const main = await getMainBranchName(repoPath);
    const diffResult = await new Command('git', ['diff', 'HEAD', `origin/${main}`, '--']).execute()
    if (diffResult.code !== 0) {
      debug(`Failed #hasNoDiffWithOriginHead ${asString(diffResult)}`)
      return "failed to execute"
    } else if (diffResult.stdout.length === 0 && diffResult.stderr.length === 0) return "bad"
    else return "good"
  } catch (e) {
    return 'failed to execute'
  }
}

async function getCurrentBranchName(repoDir: string): Promise<string> {
  const result: ChildProcess = await new Command('git', ['branch'], {cwd: repoDir}).execute()
  if (result.code !== 0) throw new Error(`Unable to determine current branch name of ${repoDir} due to ${asString(result)}`)
  const currentBranchLine: string | undefined = result.stdout.split('\n').find((line) => line.startsWith('* '))
  if (!currentBranchLine) throw new Error(`Unable to determine current branch name of ${repoDir}, unintelligible output`)
  return currentBranchLine.substring(2)
}

async function getMainBranchName(repoDir: string): Promise<string> {
  const result: ChildProcess = await new Command('git', ['remote', 'show', 'origin'], {cwd: repoDir}).execute()
  if (result.code !== 0) throw new Error(`Unable to determine head branch name of ${repoDir} due to ${asString(result)}`)
  const headBranchRow: string | undefined = result.stdout.split('\n').find(e => e.startsWith('  HEAD branch: '))
  if (!headBranchRow) throw new Error(`Unable to head branch of ${repoDir}`)
  const rowParts: string[] = headBranchRow.split(' ')
  return rowParts[rowParts.length - 1]
}
