import {useState} from "react";

export function useMutableState<T>(defaultValue: T): [T,  ((a: (draft: T) => void) => void), (full:T) => void] {
  const [state, setState] = useState(defaultValue);
  const fn: (a: (draft: T) => void) => void = (a:(draft:T) => void) => {
    const t:T = {...state}
    a(t)
    setState(t)
  }
  return [state, fn, setState]
}
