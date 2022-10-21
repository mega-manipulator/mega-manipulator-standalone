import {logDebug, logInfo} from "../hooks/logWrapper";

export async function sleepUntilEpocSecond(epocSecond: number) {
  const now = (new Date()).getDate()
  const time = Math.max(0, (epocSecond * 1000 - now))
  await sleep(time)
}

export async function sleep(ms: number) {
  if (ms < 2000) {
    logDebug(`Going to sleep for ${ms}ms`)
  } else {
    logInfo(`Going to sleep for ${ms}ms`)
  }
  await new Promise(r => setTimeout(r, ms));
}
