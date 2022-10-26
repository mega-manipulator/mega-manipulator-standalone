import {fs} from "@tauri-apps/api";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {asString} from "../../hooks/logWrapper";
import {debug, error, trace, warn} from "tauri-plugin-log-api";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {CloneWorkMeta} from "../git/cloneWorker";

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

export interface RepoBadStatesReport {
  repoPath: string;
  uncommittedChanges: boolean;
  onDefaultBranch: boolean;
  noDiffWithOriginHead: boolean;
}

export async function analyzeRepoForBadStates(settings: MegaSettingsType, repoPath: string): Promise<RepoBadStatesReport> {
  const [uncommittedChanges, onDefaultBranch, noDiffWithOriginHead] = await Promise.all([hasUncommittedChanges(repoPath), hasOnDefaultBranch(repoPath), hasNoDiffWithOriginHead(repoPath)])
  const trimmedRepoPath = repoPath.substring((settings.clonePath?.length ?? -1) + 1)
  return {
    repoPath: trimmedRepoPath,
    uncommittedChanges,
    onDefaultBranch,
    noDiffWithOriginHead,
  }
}

async function hasUncommittedChanges(repoPath: string): Promise<boolean> {
  const result = await new Command('git', ['diff'], {cwd: repoPath}).execute()
  debug(`Ran 'git diff' in ${repoPath} with result: ${asString(result)}`)
  return result.code !== 0 || result.stdout.length !== 0 || result.stderr.length !== 0
}

async function hasOnDefaultBranch(repoPath: string): Promise<boolean> {
  const [current, main] = await Promise.all([
    getCurrentBranchName(repoPath),
    getMainBranchName(repoPath),
  ])
  return current === main;
}

async function hasNoDiffWithOriginHead(repoPath: string): Promise<boolean> {
  const [current, main] = await Promise.all([
    getCurrentBranchName(repoPath),
    getMainBranchName(repoPath),
  ])
  const diffResult = await new Command('git', ['diff', current, `origin/${main}`]).execute()
  return diffResult.code !== 0 || diffResult.stdout !== '' || diffResult.stderr !== ''
}

async function getCurrentBranchName(repoDir:string): Promise<string>{
  const result: ChildProcess = await new Command('git', ['branch'], {cwd:repoDir}).execute()
  if (result.code !== 0) throw new Error(`Unable to determine current branch name of ${repoDir} due to ${asString(result)}`)
  const currentBranchLine: string | undefined = result.stdout.split('\n').find((line) => line.startsWith('* '))
  if (!currentBranchLine) throw new Error(`Unable to determine current branch name of ${repoDir}, unintelligible output`)
  return currentBranchLine.substring(2)
}

async function getMainBranchName(repoDir: string): Promise<string> {
  const result: ChildProcess = await new Command('git', ['remote', 'show', 'origin'], {cwd:repoDir}).execute()
  if (result.code !== 0) throw new Error(`Unable to determine head branch name of ${repoDir} due to ${asString(result)}`)
  const headBranchRow: string | undefined = result.stdout.split('\n').find(e => e.startsWith('  HEAD branch: '))
  if (!headBranchRow) throw new Error(`Unable to head branch of ${repoDir}`)
  const rowParts:string[] = headBranchRow.split(' ')
  return rowParts[rowParts.length - 1]
}
