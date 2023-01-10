import { fs, path } from '@tauri-apps/api';
import { MegaSettingsType } from '../../hooks/settings';
import { asString } from '../../hooks/logWrapper';
import { debug, error, trace, warn } from 'tauri-plugin-log-api';
import { ChildProcess, Command } from '@tauri-apps/api/shell';
import { SearchHit } from '../../ui/search/types';
import { WorkMeta } from '../types';
import { runCommand } from '../work/workLog';
import { requireZeroStatus } from './simpleActionWithResult';

export async function listRepos(
  basePath: string,
  depth?: number
): Promise<string[]> {
  if (!basePath) {
    warn('listRepos bailed, one or more GitDir not defined in settings');
    return [];
  }
  try {
    return await listClonesRecursive(depth ?? 3, basePath);
  } catch (e) {
    error('listRepos encountered an exception: ' + asString(e));
    return [];
  }
}

export async function pathToSearchHit(
  searchHost: string | null,
  repoPath: string
): Promise<SearchHit> {
  const repo = await path.basename(repoPath);
  const ownerPath = await path.dirname(repoPath);
  const owner = await path.basename(ownerPath);

  const codePath = await path.dirname(ownerPath);
  const codeHost = await path.basename(codePath);

  const cloneAddr = await cloneAddress(repoPath);

  return {
    searchHost,
    codeHost,
    owner,
    repo,
    sshClone: cloneAddr,
  };
}

async function cloneAddress(repoPath: string): Promise<string> {
  try {
    const remoteListing = await new Command('git', ['remote', '-v'], {
      cwd: repoPath,
    }).execute();
    if (remoteListing.code === 0) {
      const originLine = remoteListing.stdout
        .split('\n')
        .find((line) => line.startsWith('origin') && line.endsWith('(push)'));
      if (originLine) {
        return originLine.split(/ */g)[1];
      }
    }
  } catch (e) {
    error('Exception reverseEngineering clone address for repo ' + asString(e));
  }
  return 'unknown';
}

async function listClonesRecursive(
  depth: number,
  path: string
): Promise<string[]> {
  const dir = await fs.readDir(path);
  if (depth === 0) {
    if (dir.some((f) => f.name === '.git')) {
      trace(`Here I am at path ${path}`);
      return [path];
    } else {
      trace(`Here I am at path ${path} WITHOUT a .GIT`);
      return [];
    }
  } else {
    const aggregate: string[] = [];
    for (const fileEntry of dir) {
      if (fileEntry.children) {
        const atLevel = await listClonesRecursive(depth - 1, fileEntry.path);
        aggregate.push(...atLevel);
      }
    }
    return aggregate;
  }
}

export type Report = {
  state: ReportSate;
  error?: string;
};
export type ReportSate = 'good' | 'bad' | 'loading' | 'failed to execute';

export class RepoBadStatesReport {
  readonly repoPathShort: string;
  readonly repoPathLong: string;
  readonly uncommittedChanges: Report = { state: 'loading' };
  readonly onDefaultBranch: Report = { state: 'loading' };
  readonly noDiffWithOriginHead: Report = { state: 'loading' };
  readonly noCodeHostConfig: Report = { state: 'loading' };

  constructor(repoPathLong: string, repoPathShort: string) {
    this.repoPathShort = repoPathShort;
    this.repoPathLong = repoPathLong;
  }
}

export async function analyzeRepoForBadStates(
  settings: MegaSettingsType,
  repoPath: string
): Promise<RepoBadStatesReport> {
  const trimmedRepoPath = repoPath.substring(
    (settings.clonePath?.length ?? -1) + 1
  );
  try {
    const [uncommittedChanges, onDefaultBranch, noDiffWithOriginHead] =
      await Promise.all([
        hasUncommittedChanges(repoPath),
        hasOnDefaultBranch(repoPath),
        hasNoDiffWithOriginHead(repoPath),
      ]);
    const codeHostPath = await path.resolve(repoPath, '..', '..');
    const codeHostDirName = await path.basename(codeHostPath);

    const noCodeHostConfig: Report =
      settings.codeHosts[codeHostDirName] != undefined
        ? { state: 'good' }
        : {
            state: 'bad',
            error: `No code host config for '${codeHostDirName}'`,
          };
    if (noCodeHostConfig.state === 'bad') {
      debug(
        'codeHostDirName does not have matching codeHostConfig: ' +
          codeHostDirName
      );
    }

    return {
      repoPathLong: repoPath,
      repoPathShort: trimmedRepoPath,
      uncommittedChanges,
      onDefaultBranch,
      noDiffWithOriginHead,
      noCodeHostConfig,
    };
  } catch (e) {
    error('Failed to execute: ' + asString(e));
    return {
      repoPathLong: repoPath,
      repoPathShort: trimmedRepoPath,
      uncommittedChanges: { state: 'failed to execute', error: asString(e) },
      onDefaultBranch: { state: 'failed to execute', error: asString(e) },
      noDiffWithOriginHead: { state: 'failed to execute', error: asString(e) },
      noCodeHostConfig: { state: 'failed to execute', error: asString(e) },
    };
  }
}

async function hasUncommittedChanges(repoPath: string): Promise<Report> {
  const result = await new Command('git', ['diff', '--name-only', 'HEAD'], {
    cwd: repoPath,
  }).execute();
  debug(
    `Ran 'git diff --name-only HEAD' in ${repoPath} with result: ${asString(
      result
    )}`
  );
  if (result.code !== 0)
    return { state: 'failed to execute', error: asString(result) };
  else if (result.stdout.length === 0 && result.stderr.length === 0)
    return { state: 'good' };
  else return { state: 'bad', error: asString(result) };
}

async function hasOnDefaultBranch(repoPath: string): Promise<Report> {
  try {
    const [current, main] = await Promise.all([
      getCurrentBranchName(repoPath),
      getMainBranchName(repoPath),
    ]);
    return current === main
      ? {
          state: 'bad',
          error: `current branch '${current}' is same as the default branch`,
        }
      : { state: 'good' };
  } catch (e) {
    error('Failed to get #hasOnDefaultBranch: ' + asString(e));
    return { state: 'failed to execute', error: asString(e) };
  }
}

async function hasNoDiffWithOriginHead(repoPath: string): Promise<Report> {
  try {
    const main = await getMainBranchName(repoPath);
    const diffResult = await new Command('git', [
      'diff',
      'HEAD',
      `origin/${main}`,
      '--',
    ]).execute();
    if (diffResult.code !== 0) {
      debug(`Failed #hasNoDiffWithOriginHead ${asString(diffResult)}`);
      return { state: 'failed to execute', error: asString(diffResult) };
    } else if (diffResult.stdout.length === 0)
      return { state: 'bad', error: 'No diff' };
    else return { state: 'good' };
  } catch (e) {
    return { state: 'failed to execute', error: asString(e) };
  }
}

export async function getCurrentBranchName(repoDir: string): Promise<string> {
  const result: ChildProcess = await new Command('git', ['branch'], {
    cwd: repoDir,
  }).execute();
  if (result.code !== 0)
    throw new Error(
      `Unable to determine current branch name of ${repoDir} due to ${asString(
        result
      )}`
    );
  const currentBranchLine: string | undefined = result.stdout
    .split('\n')
    .find((line) => line.startsWith('* '));
  if (!currentBranchLine)
    throw new Error(
      `Unable to determine current branch name of ${repoDir}, unintelligible output`
    );
  return currentBranchLine.substring(2);
}

export async function getMainBranchName(
  repoDir: string,
  meta?: WorkMeta
): Promise<string> {
  /** Local lookup up remotes head branch 💩 Because it's 100~ times faster */
  const headBranchFile = await path.join(
    repoDir,
    '.git',
    'refs',
    'remotes',
    'origin',
    'HEAD'
  );
  const headBranchFileContent = await fs.readTextFile(headBranchFile);
  if (headBranchFileContent.startsWith('ref: refs/remotes/origin/')) {
    return headBranchFileContent.split('\n')[0].substring(25);
  }

  const result: ChildProcess = requireZeroStatus(
    await runCommand('git', ['remote', 'show', 'origin'], repoDir, meta),
    'Fetch remote branches'
  );
  const headBranchRow: string | undefined = result.stdout
    .split('\n')
    .find((e) => e.startsWith('  HEAD branch: '));
  if (!headBranchRow) throw new Error(`Unable to head branch of ${repoDir}`);
  const rowParts: string[] = headBranchRow.split(' ');
  return rowParts[rowParts.length - 1];
}
