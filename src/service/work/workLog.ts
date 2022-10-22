import {Store} from "tauri-plugin-store-api";
import {WorkResult} from "../types";

const store = new Store('.worklog.dat');
const nodeName = 'worklog'

export async function saveResultToStorage(result: WorkResult<any,any>) {
  const existing = await getResultFromStorage()
  existing[result.time] = result
  await store.set(nodeName, existing)
}

export async function getResultFromStorage(): Promise<({ [key: number]:WorkResult<any, any> })> {
  return await store.get(nodeName) ?? {}
}

