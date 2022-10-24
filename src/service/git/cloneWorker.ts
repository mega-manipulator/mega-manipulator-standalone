import {SearchHit} from "../../ui/search/types";
import {WorkProgress, WorkProgressTracker, WorkResult, WorkResultStatus} from "../types";
import {sleep} from "../delay";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {homeDir, join} from '@tauri-apps/api/path';
import {fs} from "@tauri-apps/api";
import {createDir, FileEntry, removeDir} from "@tauri-apps/api/fs";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {copyDir} from "../file/copyDirService";
import {saveResultToStorage} from "../work/workLog";
import {debug, error, info} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";

export type CloneState = 'cloned from remote' | 'cloned from local' | 'failed'
export type CloneType = 'SSH' | 'HTTPS'
export type CloneHistoryItem = {
  what: string,
  result: any,
  status: WorkResultStatus,
}
export type CloneWorkMeta = {
  workLog: CloneHistoryItem[]
}

/**
 * Returns the timestamp that marks the resulting worklog item, which can be used to navigate to it
 */
export async function clone(
  hits: SearchHit[],
  /** Used as a human-readable ref for the WorkResult, search-string or some other user-input is recommended */
  sourceString: string,
  branch: string,
  cloneType: CloneType,
  settings: MegaSettingsType,
  listener: (progress: WorkProgress) => void,
): Promise<number> {
  if(!branch || branch.length === 0) throw 'Branch name is not set'
  let time = new Date().getTime();
  const result: WorkResult<SearchHit, CloneWorkMeta> = {
    kind: "clone", name: sourceString, status: 'in-progress', time,
    result: hits.map(h => ({
      input: h,
      output: {
        status: "in-progress"
      }
    }))
  }
  await debug(`Start work on ${asString(result)}`)
  let progressTracker = new WorkProgressTracker(hits.length)
  for (let i = 0; i < result.result.length; i++) {
    const hit: SearchHit = result.result[i].input
    const meta:CloneWorkMeta = {
      workLog: []
    };
    result.result[i].output.meta = meta;
    try {
      const keepPath = await getKeepDir(settings, hit)
      const clonePath = await getCloneDir(settings, hit)
      const url = cloneType === 'SSH' ? hit.sshClone : hit.httpsClone;
      await info(`Clone ${url}, keepPath:${keepPath}, clonePath:${clonePath}`)
      const cloneResult = await cloneIfNeeded(keepPath, url, meta)
      await restoreRepoFromKeep(keepPath, clonePath, branch, meta)

      result.result[i].output.status = "ok";
      result.status = "ok"
      listener(progressTracker.progress(cloneResult))
    } catch (e) {
      const strErr = asString(e);
      await error(strErr)
      const limitedStrErr = strErr.substring(0, Math.min(15, strErr.length));
      listener(progressTracker.progress(`failed: ${limitedStrErr}`))
      result.result[i].output.status = "failed";
      result.status = "failed"
    }
  }
  await saveResultToStorage(result);
  return time;
}

async function cloneIfNeeded(clonePath: string, url: string, meta: CloneWorkMeta): Promise<CloneState> {
  await createDir(clonePath, {recursive: true});
  const cloneFsList: FileEntry[] = await fs.readDir(clonePath)
  await sleep(1000)
  //TODO: Add retry here?? GitHub sometimes throttle cloning.
  if (!cloneFsList.some(e => e.name === '.git')) {
    requireZeroStatus(await runCommand('git', ['clone', url, '.'], clonePath, meta), `Failed to clone ${url}`)
    return 'cloned from remote'
  } else {
    requireZeroStatus(await runCommand('git', ['fetch', 'origin'], clonePath, meta), `Failed to fetch ${url}`)
    return 'cloned from local'
  }
}

function requireZeroStatus(command: ChildProcess, errPhrase: string): ChildProcess {
  if (command.code !== 0) throw errPhrase;
  return command;
}

async function restoreRepoFromKeep(keepPath: string, clonePath: string, branch:string, meta: CloneWorkMeta): Promise<boolean> {
  try {
    await removeDir(clonePath, {recursive: true});
  } catch (e) {
  }
  await createDir(clonePath, {recursive: true});
  const keepFsList: FileEntry[] = await fs.readDir(keepPath)
  if (keepFsList.some(e => e.name === '.git')) {
    await copyDir(await join(keepPath, '.git'), await join(clonePath, '.git'))
    const mainBranch = await getMainBranchName(keepPath, meta)
    await debug(`Main branch of ${keepPath} is ${mainBranch}`)
    await gitFetch(keepPath, mainBranch, branch, meta)
    return true
  }
  return false
}

async function gitFetch(repoDir: string, mainBranch: string, branch: string, meta: CloneWorkMeta) {
  requireZeroStatus(
    await runCommand('git', ['checkout', '-f', mainBranch], repoDir, meta),
  'Checkout main branch'
  )
  requireZeroStatus(
    await runCommand('git', ['reset', '--hard', `origin/${mainBranch}`], repoDir, meta),
      'Reset state of '+mainBranch+' to origin'
  )
  if (mainBranch != branch) {
    const chkOut = await runCommand('git', ['checkout', branch], repoDir, meta)
    if (chkOut.code === 0) requireZeroStatus(
      await runCommand('git', ['reset', '--hard', `origin/${branch}`], repoDir, meta),
      'Reset state of '+branch+' to origin'
    )
  }
}

async function runCommand(program: string, args: string[], dir: string, meta: CloneWorkMeta): Promise<ChildProcess> {
  const result: ChildProcess = await new Command(program, args, {cwd: dir}).execute()
  const logEntry: CloneHistoryItem = {
    what: `${program} ${JSON.stringify(args)}`,
    result,
    status: result.code === 0 ? 'ok' : 'failed'
  }
  meta.workLog.push(logEntry)
  await debug(`=> Ran '${logEntry.what}' in ${dir} with result ${JSON.stringify(result)}`)
  return result;
}

async function getMainBranchName(repoDir: string, meta: CloneWorkMeta): Promise<string> {
  const result: ChildProcess = await runCommand('git', ['remote', 'show', 'origin'], repoDir, meta)
  if (result.code !== 0) throw `Unable to determine head branch name of ${repoDir} due to ${asString(result)}`
  const headBranchRow: string | undefined = result.stdout.split('\n').find(e => e.startsWith('  HEAD branch: '))
  if (!headBranchRow) throw `Unable to head branch of ${repoDir}`
  const rowParts:string[] = headBranchRow.split(' ')
  return rowParts[rowParts.length - 1]
}

async function getKeepDir(settings: MegaSettingsType, searchHit: SearchHit) {
  const fullKeepPath = await basePath(settings.keepLocalReposPath, 'keepLocalReposPath')
  return await join(fullKeepPath, searchHit.owner, searchHit.repo)
}

async function basePath(settingBase: string | undefined, settingName: string): Promise<string> {
  if (!settingBase) throw `${settingName} is not defined`
  if (settingBase.endsWith('/')) throw `${settingName} must NOT end with /`
  const homeDirPath = await homeDir();
  return settingBase.replace(/^~\//, homeDirPath)
}

async function getCloneDir(settings: MegaSettingsType, searchHit: SearchHit) {
  const fullKeepPath = await basePath(settings.clonePath, 'clonePath')
  return await join(fullKeepPath, searchHit.searchHost, searchHit.codeHost,searchHit.owner, searchHit.repo)
}
