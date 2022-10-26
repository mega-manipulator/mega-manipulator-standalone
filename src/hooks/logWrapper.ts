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
