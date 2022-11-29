import {MegaSettingsType} from "../../hooks/settings";
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
  const [searchHostKey, setSearchHostKey] = useState<string>('LOCAL')
  const [max, setMax] = useState<number>(100)
  return {
    state,
    setState,
    searchHostKey,
    setSearchHostKey,
    max,
    setMax,
  }
}

export class SearchFieldProps {
  readonly state: SearchPageState;
  readonly setState: (state: SearchPageState) => void;
  readonly searchHostKey: string;
  readonly setSearchHostKey: (searchHostKey: string) => void;
  readonly max: number;
  readonly setMax: (max: number) => void;

  constructor(
    state: SearchPageState,
    setState: (state: SearchPageState) => void,
    searchHostKey: string,
    setSearchHostKey: (searchHostKey: string) => void,
    hits: SearchHit[],
    setHits: (hits: SearchHit[]) => void,
    settings: MegaSettingsType,
    max: number,
    setMax: (max: number) => void,
  ) {
    this.state = state;
    this.setState = setState;
    this.searchHostKey = searchHostKey;
    this.setSearchHostKey = setSearchHostKey;
    this.max = max;
    this.setMax = setMax;
  }
}
