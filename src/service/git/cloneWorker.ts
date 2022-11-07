import {SearchHit} from "../../ui/search/types";
import {WorkMeta, WorkProgress, WorkProgressTracker, WorkResult} from "../types";
import {sleep} from "../delay";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {homeDir, join} from '@tauri-apps/api/path';
import {fs, path} from "@tauri-apps/api";
import {createDir, FileEntry, removeDir} from "@tauri-apps/api/fs";
import {ChildProcess} from "@tauri-apps/api/shell";
import {copyDir} from "../file/copyDirService";
import {runCommand, saveResultToStorage} from "../work/workLog";
import {debug, error, info} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {getMainBranchName} from "../file/cloneDir";
import {requireZeroStatus} from "../file/simpleActionWithResult";

export type CloneState = 'cloned from remote' | 'cloned from local' | 'failed'
export type CloneType = 'SSH' | 'HTTPS'

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
export async function clone(input: CloneWorkInput, listener: (progress: WorkProgress) => void): Promise<number> {
  if (!input.branch || input.branch.length === 0 || !BranchRegexp.test(input.branch) || !BranchStartRegexp.test(input.branch) || !BranchEndRegexp.test(input.branch)) {
    throw new Error('Branch name is not correct')
  }
  let time = new Date().getTime();
  const result: WorkResult<CloneWorkInput, SearchHit, WorkMeta> = {
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
    const meta: WorkMeta = {workLog: []};
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

async function cloneIfNeeded(clonePath: string, url: string, fetchIfLocal: boolean, meta: WorkMeta): Promise<CloneState> {
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


async function restoreRepoFromKeep(keepPath: string, clonePath: string, branch: string, meta: WorkMeta, sparseCheckout: string | null): Promise<boolean> {
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

async function setupSparse(keepPath: string, meta: WorkMeta, sparseCheckout: string | null) {
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

async function gitFetch(repoDir: string, mainBranch: string, branch: string, meta: WorkMeta) {
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



export async function getGitDir(basePath: string | undefined, searchHit: SearchHit) {
  if (!basePath) throw new Error(`Git directory not defined. WorkDir and KeepDir are necessary.`)
  const homeDirPath = await homeDir();
  if (!basePath.startsWith(homeDirPath)) throw new Error(`'${basePath}' does not start with your home directory '${homeDirPath}'`)
  return await path.join(basePath, searchHit.codeHost, searchHit.owner, searchHit.repo)
}
