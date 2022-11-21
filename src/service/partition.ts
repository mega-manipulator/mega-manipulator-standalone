export function partition<T>(arr: T[], fn: (t: T) => boolean): T[][] {
  return arr.reduce(
    (acc, val, _idx, _arr) => {
      if (fn(val)) {
        acc[0].push(val)
      } else {
        acc[1].push(val)
      }
      return acc;
    },
    [[], []] as (T[][])
  );
}

export function groupToMap<T>(arr: T[], fn: (t: T) => string): { [key: string]: T[] } {
  return arr.reduce(
    (acc: { [key: string]: T[] }, val: T, _idx, _arr: T[]) => {
      const key: string = fn(val)
      if (acc[key]) {
        acc[key].push(val)
      } else {
        acc[key] = [val]
      }
      return acc;
    },
    {} as { [key: string]: T[] }
  );
}
