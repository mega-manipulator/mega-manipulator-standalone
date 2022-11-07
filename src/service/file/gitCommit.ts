import {SearchHit} from "../../ui/search/types";
import {
  simpleAction,
  SimpleActionProps,
  simpleActionWithResult,
  SimpleActionWithResultProps
} from "./simpleActionWithResult";
import {runCommand} from "../work/workLog";
import {WorkMeta, WorkResultStatus} from "../types";
import {Command} from "@tauri-apps/api/shell";
import {getMainBranchName} from "./cloneDir";
import {asString} from "../../hooks/logWrapper";
import {error} from "tauri-plugin-log-api";

export async function gitStage(input: SimpleActionProps) {
  return await simpleAction(input,
    (index, hit: SearchHit, path: string) =>
      new Command('git', ['diff', 'HEAD', '--name-only'], {cwd: path}).execute().then()
        .catch((e) => error('Failed to stage ' + JSON.stringify(hit) + ' ' + asString(e))),
    (hit: SearchHit, err: unknown) => error('Failed to stage ' + JSON.stringify(hit) + ' ' + asString(err)));
}

export interface GitCommitInput extends SimpleActionWithResultProps {
  readonly commitMessage: string;
}

export async function gitCommit(input: GitCommitInput): Promise<number> {
  const res = await simpleActionWithResult(input, async (index, hit: SearchHit, path: string, meta: WorkMeta, statusReport: (sts: WorkResultStatus) => void) => {
      const res = await runCommand('git', ['commit', '-m', input.commitMessage], path, meta)
      res.code === 0 ? statusReport('ok') : statusReport('failed')
    }
  )
  return res.time
}

/**
 * See the un-committed difference, pre commit
 */
export async function gitChangedFiles(input: SimpleActionProps): Promise<{ hit: SearchHit, path: string, diff: string[] }[]> {
  return await simpleAction(input, async (index, hit: SearchHit, path: string) => {
    const process = await new Command('git', ['diff', 'HEAD', '--name-only'], {cwd: path}).execute()
    const diff = process.stdout.split('\n')
    return {path, hit, diff}
  }, (hit, err) => new Promise(() => {
    return {path: '??', hit, diff: ['Error: ' + asString(err)]};
  }));
}

/**
 * See the committed difference, pre push
 */
export async function gitPrePushDiff(input: SimpleActionProps): Promise<({ hit: SearchHit, path: string, diff: string[] })[]> {
  return await simpleAction(input, async (index, hit: SearchHit, path: string) => {
    const mainBranchName = await getMainBranchName(path)
    const process = await new Command('git', ['diff', mainBranchName, `origin/${mainBranchName}`, '--name-only'], {cwd: path}).execute()
    const diff = process.stdout.split('\n')
    return {path, hit, diff}
  }, async (hit, err) => {
    return {path: '??', hit, diff: ['Error: ' + asString(err)]};
  });
}
