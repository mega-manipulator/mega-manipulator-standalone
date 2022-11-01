import {SearchHit} from "../../ui/search/types";
import {WorkProgress, WorkProgressTracker, WorkResult, WorkResultStatus} from "../types";
import {sleep} from "../delay";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {homeDir, join} from '@tauri-apps/api/path';
import {fs, path} from "@tauri-apps/api";
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

const BranchRegexp = /[/a-zA-Z0-9_-]/g
const BranchStartRegexp = /^[a-zA-Z0-9_-]/
const BranchEndRegexp = /[a-zA-Z0-9_-]$/


export type CloneWorkInput = {
  hits: SearchHit[],
  /** Used as a human-readable ref for the WorkResult, search-string or some other user-input is recommended */
  sourceString: string,
  branch: string,
  cloneType: CloneType,
  settings: MegaSettingsType,
  onlyKeep: boolean,
  fetchIfLocal: boolean,
  sparseCheckout: string | null,
}

/**
 * Returns the timestamp that marks the resulting worklog item, which can be used to navigate to it
 */
export async function clone(input:CloneWorkInput,listener: (progress: WorkProgress) => void): Promise<number> {
  if (!input.branch || input.branch.length === 0 || !BranchRegexp.test(input.branch) || !BranchStartRegexp.test(input.branch) || !BranchEndRegexp.test(input.branch)) {
    throw new Error('Branch name is not correct')
  }
  let time = new Date().getTime();
  const result: WorkResult<CloneWorkInput, SearchHit, CloneWorkMeta> = {
    kind: "clone", name: input.sourceString, status: 'in-progress', time,
    input,
    result: input.hits.map(h => ({
      input: h,
      output: {
        status: "in-progress"
      }
    }))
  }
  await debug(`Start work on ${asString(result)}`)
  let progressTracker = new WorkProgressTracker(input.hits.length);
  listener({done: 0, total: result.result.length, breakdown: {}})
  for (let i = 0; i < result.result.length; i++) {
    const hit: SearchHit = result.result[i].input;
    const meta: CloneWorkMeta = {
      workLog: [],
    };
    result.result[i].output.meta = meta;
    try {
      const keepPath = await getGitDir(input.settings.keepLocalReposPath, hit);
      const clonePath = await getGitDir(input.settings.clonePath, hit);
      await info(`Clone ${hit.sshClone}, keepPath:${keepPath}, clonePath:${clonePath}`);
      const cloneResult = await cloneIfNeeded(keepPath, hit.sshClone, input.fetchIfLocal, meta);
      if (!input.onlyKeep) {
        await restoreRepoFromKeep(keepPath, clonePath, input.branch, meta, input.sparseCheckout);
      }

      result.result[i].output.status = "ok";
      result.status = "ok";
      listener(progressTracker.progress(cloneResult));
    } catch (e) {
      const strErr = asString(e);
      await error(strErr);
      const limitedStrErr = strErr.substring(0, Math.min(15, strErr.length));
      listener(progressTracker.progress(`failed: ${limitedStrErr}`));
      result.result[i].output.status = "failed";
      result.status = "failed";
    }
  }
  await saveResultToStorage(result);
  return time;
}

async function cloneIfNeeded(clonePath: string, url: string, fetchIfLocal: boolean, meta: CloneWorkMeta): Promise<CloneState> {
  await createDir(clonePath, {recursive: true});
  const cloneFsList: FileEntry[] = await fs.readDir(clonePath)
  //TODO: Add retry here?? GitHub sometimes throttle cloning.
  if (!cloneFsList.some(e => e.name === '.git')) {
    await sleep(1000)
    await info(`Clone ${url}, clonePath:${clonePath}`);
    requireZeroStatus(await runCommand('git', ['clone', url, '.'], clonePath, meta), `Failed to clone ${url}`)
    return 'cloned from remote'
  } else if (fetchIfLocal) {
    await sleep(1000)
    await info(`Fetch ${url}, clonePath:${clonePath}`);
    requireZeroStatus(await runCommand('git', ['fetch', 'origin', 'HEAD'], clonePath, meta), `Failed to fetch ${url}`)
    return 'cloned from local'
  } else {
    await info(`Skip fetch ${url}, clonePath:${clonePath}`);
    return 'cloned from local'
  }
}

function requireZeroStatus(command: ChildProcess, errPhrase: string): ChildProcess {
  if (command.code !== 0) throw errPhrase;
  return command;
}

async function restoreRepoFromKeep(keepPath: string, clonePath: string, branch: string, meta: CloneWorkMeta, sparseCheckout: string | null): Promise<boolean> {
  try {
    await removeDir(clonePath, {recursive: true});
  } catch (e) {
  }
  await createDir(clonePath, {recursive: true});
  const keepFsList: FileEntry[] = await fs.readDir(keepPath)
  if (keepFsList.some(e => e.name === '.git')) {
    await copyDir(await join(keepPath, '.git'), clonePath)
    await setupSparse(keepPath, meta, sparseCheckout)
    const mainBranch = await getMainBranchName(keepPath, meta)
    await debug(`Main branch of ${keepPath} is ${mainBranch}`)
    await gitFetch(clonePath, mainBranch, branch, meta)
    return true
  }
  return false
}

async function setupSparse(keepPath: string, meta: CloneWorkMeta, sparseCheckout: string | null) {
  if (sparseCheckout === null) {
    return;
  }
  let sparseConfFile = await path.join(keepPath, '.git', 'info', 'sparse-checkout');
  await debug(`Setting up sparse checkout in ${sparseConfFile}`)
  await fs.removeFile(sparseConfFile)
    .then(() => meta.workLog.push({what: `Remove ${sparseConfFile}`, status: "ok", result: true}))
    .catch((e) => meta.workLog.push({what: `Remove ${sparseConfFile}`, status: "failed", result: e}));
  requireZeroStatus(await runCommand("git", ["config", "core.sparseCheckout", "true"], keepPath, meta), 'Enable sparse checkout');
  await fs.createDir(await path.dirname(sparseConfFile), {recursive: true}).catch();
  await fs.writeTextFile(sparseConfFile, sparseCheckout);
}

async function gitFetch(repoDir: string, mainBranch: string, branch: string, meta: CloneWorkMeta) {
  requireZeroStatus(
    await runCommand('git', ['checkout', '-f', mainBranch], repoDir, meta),
    'Checkout main branch'
  )
  requireZeroStatus(
    await runCommand('git', ['reset', '--hard', `origin/${mainBranch}`], repoDir, meta),
    `Reset state of ${mainBranch} to origin`
  )
  requireZeroStatus(
    await runCommand('git', ['clean', '-fd'], repoDir, meta),
    `Cleanup files`
  )
  if (mainBranch != branch) {
    await runCommand('git', ['branch', '--delete', branch], repoDir, meta)
    const chkOut = await runCommand('git', ['switch', branch], repoDir, meta)
    if (chkOut.code === 0) {
      requireZeroStatus(
        await runCommand('git', ['reset', '--hard', `origin/${branch}`], repoDir, meta),
        'Reset state of ' + branch + ' to origin'
      )
    } else {
      requireZeroStatus(await runCommand('git', ['switch', '-c', branch], repoDir, meta), 'Create branch')
    }
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
  /** Local lookup up remotes head branch 💩 Because it's 100 times faster */
  const headBranchFile = await path.join(repoDir, '.git', 'refs', 'remotes', 'origin', 'HEAD');
  const headBranchFileContent = await fs.readTextFile(headBranchFile);
  if (headBranchFileContent.startsWith('ref: refs/remotes/origin/')) {
    return headBranchFileContent.split('\n')[0].substring(25)
  }

  const result: ChildProcess = requireZeroStatus(await runCommand('git', ['remote', 'show', 'origin'], repoDir, meta), 'Fetch remote branches')
  if (result.code !== 0) throw new Error(`Unable to determine head branch name of ${repoDir} due to ${asString(result)}`)
  const headBranchRow: string | undefined = result.stdout.split('\n').find(e => e.startsWith('  HEAD branch: '))
  if (!headBranchRow) throw new Error(`Unable to head branch of ${repoDir}`)
  const rowParts: string[] = headBranchRow.split(' ')
  return rowParts[rowParts.length - 1]
}

export async function getGitDir(basePath:string | undefined, searchHit: SearchHit) {
  if (!basePath) throw new Error(`Git directory not defined. WorkDir and KeepDir are necessary.`)
  const homeDirPath = await homeDir();
  if (!basePath.startsWith(homeDirPath)) throw new Error(`'${basePath}' does not start with your home directory '${homeDirPath}'`)
  return  await path.join(basePath, searchHit.codeHost, searchHit.owner, searchHit.repo)
}
