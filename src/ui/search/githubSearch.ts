import {SearchHit} from "./types";
import {info} from "tauri-plugin-log-api";
import {useOctokit} from "../../hooks/github.com";

export async function githubSearch(searchPhrase: string): Promise<SearchHit[]> {
  info('githubSearch 1') // TODO: DELETE_ME
  let octokit = useOctokit();
  if (octokit === undefined) {
    return [];
  }
  const hits = await octokit.rest.search.code({q: searchPhrase})
  return hits.data.items.map((hit) => new SearchHit(
      'github.com',
      'github.com',
      hit.repository.owner?.name ?? '???',
      hit.repository.name,
      hit.repository.description ?? undefined,
    )
  )
  /*
    "GET /search/code",
    {q: searchPhrase},
    (response) => response.data.map((hit) =>
      new SearchHit(
        'github.com',
        'github.com',
        hit.repository.owner?.name ?? '???',
        hit.repository.name,
        hit.repository.description ?? undefined,
      )
    )
  );
  return Promise.all(hits);
   */
}
