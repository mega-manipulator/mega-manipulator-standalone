import {SearchHit} from "../../ui/search/types";
import {MegaSettingsType} from "../../hooks/settings";
import {homeDir} from "@tauri-apps/api/path";
import {ProgressReporter, WorkMeta, WorkResult, WorkResultKind, WorkResultStatus} from "../types";
import {path} from "@tauri-apps/api";
import {saveResultToStorage} from "../work/workLog";
import {error} from "tauri-plugin-log-api";
import {ChildProcess} from "@tauri-apps/api/shell";
import {pathToSearchHit} from "./cloneDir";

export interface SimpleActionProps {
  /** Either a searchHit or a path */
  readonly hits: SearchHit[] | string[],
  readonly settings: MegaSettingsType,
}

/**
 * Run stuff in parallel
 */
export async function simpleAction<T>(
  input: SimpleActionProps,
  action: (index: number, hit: SearchHit, path: string) => Promise<T>,
  errMapper: (hit: SearchHit, err: unknown) => Promise<T>,
): Promise<(T)[]> {
  const clonePath = await validClonePath(input.settings)
  const promises: Promise<T>[] = input.hits.map(async (hit, i): Promise<T> => {
    const _hit = await hitToSearchHit(hit);
    const p = await path.join(clonePath, _hit.codeHost, _hit.owner, _hit.repo);
    try {
      return await action(i, _hit, p);
    } catch (e) {
      await error('Failed action:' + e);
      return await errMapper(_hit, e);
    }
  });
  const chunkSize = 25;
  const aggregate: T[] = [];
  for (let i = 0; i < promises.length; i += chunkSize) {
    const chunk = promises.slice(i, i + chunkSize)
    const awaited: T[] = await Promise.all(chunk);
    aggregate.push(...awaited)
  }
  return aggregate;
}

async function hitToSearchHit(hit: SearchHit | string): Promise<SearchHit> {
  if (typeof hit === "string") {
    return pathToSearchHit(null, hit);
  } else {
    return hit;
  }
}

export interface SimpleActionWithResultProps extends SimpleActionProps {
  readonly workResultKind: WorkResultKind,
  readonly sourceString: string,
  readonly progress: ProgressReporter,
}

export interface SimpleActionReturn {
  time: number,
}

/**
 * Run actions one at a time, as the actions with a result usually are able to fail on the code host, which does not appreciate us DDOSing them with actions
 * @param input
 * @param action
 */
export async function simpleActionWithResult(input: SimpleActionWithResultProps, action: (index: number, hit: SearchHit, path: string, meta: WorkMeta, statusReport: (sts: WorkResultStatus) => void) => Promise<void>): Promise<SimpleActionReturn> {
  const time: number = new Date().getTime()
  const clonePath: string = await validClonePath(input.settings)

  const workResult: WorkResult<SimpleActionWithResultProps, SearchHit, WorkMeta> = {
    kind: input.workResultKind,
    name: input.sourceString,
    status: 'in-progress',
    time,
    input,
    result: [],
  };
  for (let i = 0; i < input.hits.length; i++) {
    input.progress(i, input.hits.length);
    const hit = await hitToSearchHit(input.hits[i]);
    workResult.result[i] = {
      input: hit,
      output: {
        status: "in-progress"
      }
    };
  }
  input.progress(input.hits.length, input.hits.length);
  for (let i = 0; i < workResult.result.length; i++) {
    const current = workResult.result[i].input;
    const p = await path.join(clonePath, current.codeHost, current.owner, current.repo);
    const meta: WorkMeta = {workLog: []};
    workResult.result[i].output.meta = meta;
    await action(i, current, p, meta, (sts: WorkResultStatus) => workResult.result[i].output.status = sts);
  }
  if (workResult.result.some(r => r.output.status !== 'ok')) {
    workResult.status = "failed";
  } else {
    workResult.status = "ok";
  }
  await saveResultToStorage(workResult);
  return {time};
}

async function validClonePath(settings: MegaSettingsType): Promise<string> {
  const home: string = await homeDir();
  const clonePath = settings.clonePath
  if (!clonePath) throw new Error('Clone/work-path not set')
  if (!clonePath.startsWith(home)) throw new Error('Clone/work-path is not in your home dir')
  return clonePath;
}

export function requireZeroStatus(command: ChildProcess, errPhrase: string): ChildProcess {
  if (command.code !== 0) throw errPhrase;
  return command;
}
