import {debug, error, info, trace, warn} from "tauri-plugin-log-api";

export function logInfo(message: string) {
  info(message).catch(_ => console.info(message))
}

export function logDebug(message: string) {
  debug(message).catch(_ => console.debug(message))
}

export function logError(message: string) {
  error(message).catch(_ => console.error(message))
}

export function logTrace(message: string) {
  trace(message).catch(_ => console.trace(message))
}

export function logWarn(message: string) {
  warn(message).catch(_ => console.warn(message))
}

export function asString(str: unknown): string {
  switch (typeof str) {
    case "undefined":
      return `undefined`
    case "boolean":
    case "number":
    case "bigint":
    case "string":
      return `${str}`
    case "function":
      return `FUNCTION:${str.name}`
    case "symbol":
      return `SYMBOL:${str.description}`
    case "object":
      return `${JSON.stringify(str)}`
  }
}
