export function asString(str: unknown): string {
  if (str === null) {
    return 'null'
  }
  switch (typeof str) {
    case "undefined":
      return 'undefined'
    case "boolean":
    case "number":
    case "bigint":
    case "string":
      return str as string;
    case "function":
      return `FUNCTION:${str.name}`
    case "symbol":
      return `SYMBOL:${str.description}`
    case "object":
      if (Object.keys(str).length === 0 && typeof str.toString === 'function') {
        return str.toString()
      }
      return JSON.stringify(str)
    default:
      return '???'
  }
}
