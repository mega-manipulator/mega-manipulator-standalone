import {Store} from "tauri-plugin-store-api";
import {WorkHistoryItem, WorkMeta, WorkResult} from "../types";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {debug, info} from "tauri-plugin-log-api";

const store = new Store('.worklog.dat');

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

export async function saveResultToStorage(result: WorkResult<unknown, unknown, unknown>) {
  await store.set(`${result.time}`, result)
}

export async function getResultFromStorage(time: string): Promise<WorkResult<unknown, unknown, unknown> | null> {
  return await store.get(time)
}

export async function deleteResultFromStorage(time: string): Promise<boolean> {
  return await store.delete(time)
}

export async function listResultInStorage(): Promise<string[]> {
  return await store.keys()
}

export async function pruneOldestResultsFromStorage(leave: number) {
  const allKeys = await listResultInStorage();
  const oldes = allKeys.sort().reverse()
  oldes.splice(0, leave);
  if (oldes.length > 0) {
    info(`Will now delete ${oldes.length} oldest results from storage, keeping ${leave}`)
    for (const time of oldes) {
      await deleteResultFromStorage(time)
    }
  } else {
    info(`Will not delete anything. Asked to keep ${leave} and only had ${allKeys.length}`)
  }
}

