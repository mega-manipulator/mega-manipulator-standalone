import {useState} from "react";

export interface SearchHit {
  readonly searchHost: string | null;
  readonly codeHost: string;
  readonly owner: string;
  readonly repo: string;
  readonly sshClone: string;
  readonly description?: string;
  /**
   * For pull requests to know what branch to set up after cloning
   */
  readonly branch?: string;
}

export type SearchPageState = 'loading' | 'ready' | 'searching'

export function useSearchFieldProps(): SearchFieldProps {
  const [state, setState] = useState<SearchPageState>('loading')
  const [max, setMax] = useState<number>(100)
  return {
    state,
    setState,
    max,
    setMax,
  }
}

export class SearchFieldProps {
  readonly state: SearchPageState;
  readonly setState: (state: SearchPageState) => void;
  readonly max: number;
  readonly setMax: (max: number) => void;

  constructor(
    state: SearchPageState,
    setState: (state: SearchPageState) => void,
    max: number,
    setMax: (max: number) => void,
  ) {
    this.state = state;
    this.setState = setState;
    this.max = max;
    this.setMax = setMax;
  }
}
