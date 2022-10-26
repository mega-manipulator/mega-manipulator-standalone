import {debug, info} from "tauri-plugin-log-api";

export async function sleepUntilEpocSecond(epocSecond: number) {
  const now = (new Date()).getDate()
  const time = Math.max(0, (epocSecond * 1000 - now))
  await sleep(time)
}

export async function sleep(ms: number) {
  if (ms < 2000) {
    debug(`Going to sleep for ${ms}ms`)
  } else {
    info(`Going to sleep for ${ms}ms`)
  }
  await new Promise(r => setTimeout(r, ms));
}
