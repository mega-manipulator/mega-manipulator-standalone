import {SearchHit} from "../../ui/search/types";
import {
  simpleAction,
  SimpleActionProps,
  simpleActionWithResult,
  SimpleActionWithResultProps
} from "./simpleActionWithResult";
import {runCommand} from "../work/workLog";
import {WorkMeta, WorkResultKind, WorkResultStatus} from "../types";
import {Command} from "@tauri-apps/api/shell";
import {getCurrentBranchName, getMainBranchName} from "./cloneDir";
import {asString} from "../../hooks/logWrapper";
import {MegaSettingsType} from "../../hooks/settings";
import {error} from "tauri-plugin-log-api";

export class GitStageInput implements SimpleActionWithResultProps {
  readonly files?: string[];

  /* From interfaces 👇 */
  readonly hits: SearchHit[] | string[];
  readonly settings: MegaSettingsType;
  readonly sourceString: string;
  readonly workResultKind: WorkResultKind;

  constructor(settings: MegaSettingsType, hits: SearchHit[] | string[], files?: string[]) {
    this.files = files;
    this.workResultKind = "gitStage";
    this.sourceString = 'Stage files';
    this.hits = hits;
    this.settings = settings;
  }
}

export async function gitStage(input: GitStageInput): Promise<number> {
  if (input.files === undefined) {
    return await gitStageOp(input, ['add', '--all']);
  } else {
    return await gitStageOp(input, ['add', '--']);
  }
}

export async function gitUnStage(input: GitStageInput): Promise<number> {
  return await gitStageOp(input, ['reset', '--'])
}

async function gitStageOp(input: GitStageInput, args: string[]): Promise<number> {
  const res = await simpleActionWithResult(input, async (_index, _hit: SearchHit, path: string, meta: WorkMeta, statusReport: (sts: WorkResultStatus) => void) => {
    const res = await runCommand('git', [...args, ...(input.files ?? [])], path, meta)
    res.code === 0 ? statusReport('ok') : statusReport('failed')
  })
  return res.time
}

export interface GitCommitInput extends SimpleActionWithResultProps {
  readonly commitMessage: string;
}

export async function gitCommit(input: GitCommitInput): Promise<number> {
  const res = await simpleActionWithResult(input, async (_index, _hit: SearchHit, path: string, meta: WorkMeta, statusReport: (sts: WorkResultStatus) => void) => {
    const res = await runCommand('git', ['commit', '-m', input.commitMessage], path, meta)
    res.code === 0 ? statusReport('ok') : statusReport('failed')
  })
  return res.time
}

export async function gitPush(input: SimpleActionWithResultProps): Promise<number> {
  const res = await simpleActionWithResult(input, async (_index, _hit: SearchHit, path: string, meta: WorkMeta, statusReport: (sts: WorkResultStatus) => void) => {
    const branchName = await getCurrentBranchName(path)
    const res = await runCommand('git', ['push', 'origin', branchName], path, meta)
    res.code === 0 ? statusReport('ok') : statusReport('failed')
  })
  return res.time
}

export interface GitDiff {
  hit: SearchHit;
  path: string;
  diffFiles: string[];
}

export async function gitGetStagedFiles(input: SimpleActionProps): Promise<GitDiff[]> {
  return await gitDiffyFiles(input, ['diff', '--staged', '--name-only'])
}

export function gitGetUnStagedFiles(input: SimpleActionProps): Promise<GitDiff[]> {
  return gitDiffyFiles(input, ['diff', '--name-only']);
}

/**
 * See the un-committed difference, pre commit
 */
export function gitChangedFiles(input: SimpleActionProps): Promise<GitDiff[]> {
  return gitDiffyFiles(input, ['diff', 'HEAD', '--name-only'])
}

async function gitDiffyFiles(input: SimpleActionProps, gitArgs: string[]): Promise<GitDiff[]> {
  return await simpleAction(
    input,
    async (_index, hit: SearchHit, path: string) => {
      try {
        const process = await new Command('git', gitArgs, {cwd: path}).execute()
        const diffFiles = process.stdout.split('\n').filter((f) => f !== '')
        return {path, hit, diffFiles}
      } catch (e) {
        error('FAILED°!!') // TODO
        throw e;
      }
    }, async (hit, err) => ({path: '??', hit, diffFiles: ['Error: ' + asString(err)]})
  );
}

/**
 * See the committed difference, pre push
 */
export async function gitPrePushDiff(input: SimpleActionProps): Promise<GitDiff[]> {
  return await simpleAction(input, async (_index, hit: SearchHit, path: string) => {
    const mainBranchName = await getMainBranchName(path)
    const process = await new Command('git', ['diff', mainBranchName, `origin/${mainBranchName}`, '--name-only'], {cwd: path}).execute()
    const diffFiles = process.stdout.split('\n')
    return {path, hit, diffFiles}
  }, async (hit, err) => {
    return {path: '??', hit, diffFiles: ['Error: ' + asString(err)]};
  });
}
