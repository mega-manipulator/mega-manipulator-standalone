import {Store} from "tauri-plugin-store-api";
import {WorkHistoryItem, WorkMeta, WorkResult} from "../types";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {debug} from "tauri-plugin-log-api";

const store = new Store('.worklog.dat');
const nodeName = 'worklog'

export async function runCommand(program: string, args: string[], dir: string, meta?: WorkMeta): Promise<ChildProcess> {
  const result: ChildProcess = await new Command(program, args, {cwd: dir}).execute()
  if (meta) {
    const logEntry: WorkHistoryItem = {
      what: `${program} ${JSON.stringify(args)}`,
      result,
      status: result.code === 0 ? 'ok' : 'failed'
    }
    meta.workLog.push(logEntry)
    await debug(`=> Ran '${logEntry.what}' in ${dir} with result ${JSON.stringify(result)}`)
  }
  return result;
}

export async function saveResultToStorage(result: WorkResult<any, any, any>) {
  const existing = await getResultFromStorage()
  existing[result.time] = result
  await store.set(nodeName, existing)
}

export async function getResultFromStorage(): Promise<({ [key: number]: WorkResult<any, any, any> })> {
  return await store.get(nodeName) ?? {}
}

