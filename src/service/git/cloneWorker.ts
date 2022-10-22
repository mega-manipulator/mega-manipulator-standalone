import {SearchHit} from "../../ui/search/types";
import {WorkProgress, WorkProgressTracker} from "../types";
import {sleep} from "../delay";
import {asString, logDebug, logError, logInfo, logTrace} from "../../hooks/logWrapper";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {homeDir, join} from '@tauri-apps/api/path';
import {fs} from "@tauri-apps/api";
import {createDir, FileEntry, removeDir} from "@tauri-apps/api/fs";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {copyDir} from "../file/copyDirService";

export type CloneState = 'cloned from remote' | 'cloned from local' | 'failed'
export type CloneType = 'SSH' | 'HTTPS'


export async function clone(hits: SearchHit[], cloneType: CloneType, settings: MegaSettingsType, listener: (progress: WorkProgress) => void) {
  let progressTracker = new WorkProgressTracker(hits.length)
  for (const hit of hits) {
    try {
      await sleep(1000)
      const keepPath = await getKeepDir(settings, hit)
      const clonePath = await getCloneDir(settings, hit)
      const url = cloneType === 'SSH' ? hit.sshClone : hit.httpsClone;
      logInfo(`Clone ${url}`)
      const result = await cloneIfNeeded(keepPath, url)
      await restoreRepoFromKeep(keepPath, clonePath)

      listener(progressTracker.progress(result))
    } catch (e) {
      const strErr = asString(e);
      logError(strErr)
      const limitedStrErr = strErr.substring(0, Math.min(15, strErr.length));
      listener(progressTracker.progress(`failed: ${limitedStrErr}`))
    }
  }
}

async function cloneIfNeeded(clonePath: string, url: string): Promise<'cloned' | 'local'> {
  await createDir(clonePath, {recursive: true});
  const cloneFsList: FileEntry[] = await fs.readDir(clonePath)
  await sleep(1000)
  if (!cloneFsList.some(e => e.name === '.git')) {
    requireZeroStatus(await runCommand('git', ['clone', url, '.'], clonePath), `Failed to clone ${url}`)
    return 'cloned'
  } else {
    requireZeroStatus(await runCommand('git', ['fetch', 'origin'], clonePath), `Failed to clone ${url}`)
    return 'local'
  }
}

function requireZeroStatus(command: ChildProcess, errPhrase: string): ChildProcess {
  if (command.code !== 0) throw errPhrase;
  return command;
}

async function restoreRepoFromKeep(keepPath: string, clonePath: string): Promise<boolean> {
  const cloneGitPath = await join(clonePath, '.git')
  try {
    await removeDir(cloneGitPath, {recursive: true});
  } catch (e) {
  }
  const keepGitPath = await join(keepPath, '.git')
  await createDir(cloneGitPath, {recursive: true});
  const keepFsList: FileEntry[] = await fs.readDir(keepPath)
  if (keepFsList.some(e => e.name === '.git')) {
    await copyDir(keepGitPath, cloneGitPath)
    const mainBranch = await getMainBranchName(keepPath)
    logDebug(`Main branch of ${keepGitPath} is ${mainBranch}`)
    await gitFetch(keepGitPath, mainBranch)
    return true
  }
  return false
}

async function gitFetch(repoDir: string, mainBranch: string, branch?: string) {
  await runCommand('git', ['checkout', '-f', mainBranch], repoDir)
  await runCommand('git', ['reset', '--hard', `origin/${mainBranch}`], repoDir)
  if (branch && mainBranch != branch) {
    const chkOut = await runCommand('git', ['checkout', mainBranch], repoDir)
    if (chkOut.code === 0) await runCommand('git', ['reset', '--hard', `origin/${mainBranch}`], repoDir)
  }
}

async function runCommand(program: string, args: string[], dir: string): Promise<ChildProcess> {
  const result = await new Command(program, args, {cwd: dir}).execute()
  logDebug(`=> Ran '${program} ${JSON.stringify(args)}' in ${dir} with result ${JSON.stringify(result)}`)
  return result;
}

async function getMainBranchName(repoDir: string): Promise<string> {
  const result: ChildProcess = await runCommand('git', ['remote', 'show', 'origin'], repoDir)
  if (result.code !== 0) throw `Unable to determine head branch name of ${repoDir} due to ${asString(result)}`
  const headBranchRow: string | undefined = result.stdout.split('\n').find(e => e.startsWith('  HEAD branch: '))
  if (!headBranchRow) throw `Unable to head branch of ${repoDir}`
  return headBranchRow.substring(headBranchRow.length - 15)
}

async function getKeepDir(settings: MegaSettingsType, searchHit: SearchHit) {
  const fullKeepPath = await basePath(settings.keepLocalReposPath, 'keepLocalReposPath')
  return await join(fullKeepPath, 'clones', searchHit.searchHost, searchHit.codeHost, searchHit.owner, searchHit.repo)
}

async function basePath(settingBase: string | undefined, settingName: string): Promise<string> {
  if (!settingBase) throw `${settingName} is not defined`
  if (!settingBase.startsWith('~/')) throw `${settingName} must start with ~/`
  if (settingBase.endsWith('/')) throw `${settingName} must NOT end with /`
  const homeDirPath = await homeDir();
  return settingBase.replace(/^~\//, homeDirPath)
}

async function getCloneDir(settings: MegaSettingsType, searchHit: SearchHit) {
  const fullKeepPath = await basePath(settings.clonePath, 'clonePath')
  return await join(fullKeepPath, searchHit.owner, searchHit.repo)
}
