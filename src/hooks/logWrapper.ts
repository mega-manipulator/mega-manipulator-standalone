export function asString(str: unknown, indent?: number): string {
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
      return `FUNCTION:${str.name}`;
    case "symbol":
      return `SYMBOL:${str.description}`;
    case "object":
      if (Array.isArray(str) && str.length === 0) {
        return '[]';
      }
      if (Object.keys(str).length === 0 && typeof str.toString === 'function') {
        return str.toString();
      }
      try {
        return JSON.stringify(str, undefined, indent);
      } catch (e) {
        return `[object: ${e}]`
      }
    default:
      return '???';
  }
}
