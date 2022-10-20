export class SearchHit {
  searchHost: string;
  codeHost: string;
  owner: string;
  repo: string;
  description?: string;

  constructor(searchHost: string, codeHost: string, owner: string, repo: string, description?: string) {
    this.searchHost = searchHost;
    this.codeHost = codeHost;
    this.owner = owner;
    this.repo = repo;
    this.description = description;
  }
}

export interface SearchClient {
  searchCode(searchString: string, max: number): Promise<SearchHit[]>;
}
