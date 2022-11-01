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

export interface SearchClient {
  searchCode(searchString: string, max: number): Promise<SearchHit[]>;
}

export type SearchPageState = 'loading' | 'ready' | 'searching'

export class SearchFieldProps {
  readonly state: SearchPageState;
  readonly setState: (state: SearchPageState) => void;
  readonly searchHostKey: string;
  readonly setSearchHostKey: (searchHostKey: string) => void;
  readonly hits: SearchHit[];
  readonly setHits: (hits: SearchHit[]) => void;

  constructor(
    state: SearchPageState,
    setState: (state: SearchPageState) => void,
    searchHostKey: string,
    setSearchHostKey: (searchHostKey: string) => void,
    hits: SearchHit[],
    setHits: (hits: SearchHit[]) => void,
  ) {
    this.state = state;
    this.setState = setState;
    this.searchHostKey = searchHostKey;
    this.setSearchHostKey = setSearchHostKey;
    this.hits = hits;
    this.setHits = setHits;
  }
}
