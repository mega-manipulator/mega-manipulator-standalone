export class SearchHit {
  public readonly searchHost: string;
  public readonly codeHost: string;
  public readonly owner: string;
  public readonly repo: string;
  public readonly sshClone: string;
  public readonly httpsClone: string;
  public readonly description?: string;

  constructor(
    searchHost: string,
    codeHost: string,
    owner: string,
    repo: string,
    sshClone: string,
    httpsClone: string,
    description?: string
  ) {
    this.searchHost = searchHost;
    this.codeHost = codeHost;
    this.owner = owner;
    this.repo = repo;
    this.sshClone = sshClone;
    this.httpsClone = httpsClone;
    this.description = description;
  }
}

export interface SearchClient {
  searchCode(searchString: string, max: number): Promise<SearchHit[]>;
}
