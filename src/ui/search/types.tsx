import {MegaSettingsType} from "../../hooks/settings";
import {useState} from "react";

export class SearchHit {
  public readonly searchHost: string | null;
  public readonly codeHost: string;
  public readonly owner: string;
  public readonly repo: string;
  public readonly sshClone: string;
  public readonly description?: string;

  constructor(
    searchHost: string | null,
    codeHost: string,
    owner: string,
    repo: string,
    sshClone: string,
    description?: string
  ) {
    this.searchHost = searchHost;
    this.codeHost = codeHost;
    this.owner = owner;
    this.repo = repo;
    this.sshClone = sshClone;
    this.description = description;
  }
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
