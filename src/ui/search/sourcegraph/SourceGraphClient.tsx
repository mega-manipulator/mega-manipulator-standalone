import {cloneUrl, MegaSettingsType, SourceGraphSearchHostSettings} from "../../../hooks/settings";
import {SourceGraphSearchFieldProps} from "./SourceGraphSearchField";
import {useContext, useEffect, useState} from "react";
import {getPassword} from "../../../hooks/usePassword";
import axios from "axios";
import {debug, error, trace, warn} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";
import {SearchHit} from "../types";
import {MegaContext} from "../../../hooks/MegaContext";

export interface SourceGraphClientWrapper {
  client: SourceGraphClient | undefined;
  error: string | undefined;
}

export interface SourceGraphSearchHandle {
  cancel: () => void;
}

const sourceGraphGraphQlString = `query Search($query: String!) {
  search(query: $query, version: V3) {
    results {
      limitHit
      matchCount
      approximateResultCount
      missing {
        name
      }
      repositoriesCount
      timedout {
        name
      }
      alert {
        title
        description
        proposedQueries {
          description
          query
        }
      }
      elapsedMilliseconds
      results {
        __typename
        ... on FileMatch {
          repository {
            name
          }
        }
        ... on Repository {
          name
        }
        ... on CommitSearchResult {
          commit {
            repository {
              name
            }
          }
        }
      }
    }
  }
}
`

export class SourceGraphClient {
  readonly token: string;
  readonly baseUrl: string;
  readonly searchHostKey: string;
  readonly searchSettings: SourceGraphSearchHostSettings;
  readonly props: SourceGraphSearchFieldProps;
  readonly settings: MegaSettingsType;

  constructor(
    token: string,
    baseUrl: string,
    searchHostKey: string,
    searchSettings: SourceGraphSearchHostSettings,
    props: SourceGraphSearchFieldProps,
    settings: MegaSettingsType,
  ) {
    this.token = token;
    this.baseUrl = baseUrl;
    this.searchHostKey = searchHostKey;
    this.searchSettings = searchSettings;
    this.props = props;
    this.settings = settings;
  }

  async searchCode(searchString: string, max?: number): Promise<SearchHit[]> {
    const searchHits = new Set<SearchHit>();
    try {
      debug('Requesting data from sourcegraph')
      const response = await axios({
        method: "POST",
        timeout: 60000,
        url: `${this.searchSettings.baseUrl}/.api/graphql`,
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/json',
        },
        responseType: 'json',
        data: {
          query: sourceGraphGraphQlString,
          variables: {
            query: searchString,
          },
        },
      });
      const alert: string | null | undefined = response?.data?.search?.results?.alert
      if (alert) warn(`Alert: ${alert}`)

      trace('response?.data?.data?.search?.results?.results' + asString(response?.data?.data?.search?.results?.results))
      response?.data?.data?.search?.results?.results?.forEach((item: any) => {
        if (searchHits.size === max)
          return;
        let hit: SearchHit | undefined = undefined;
        trace('Evaluating result item: ' + asString(item))
        switch (item?.__typename) {
          case 'FileMatch':
            hit = this.sgRepoStringToSearchHit(item?.repository?.name);
            break;
          case 'Repository':
            hit = this.sgRepoStringToSearchHit(item?.name);
            break;
          case 'CommitSearchResult':
            hit = this.sgRepoStringToSearchHit(item?.commit?.repository?.name);
            break;
        }
        if (hit) searchHits.add(hit)
      });

    } catch (e: unknown) {
      error(`Failed in some way: ${asString(e)}`);
    }
    return Array.from(searchHits.values());
  }

  private sgRepoStringToSearchHit(repoString?: string): SearchHit | undefined {
    try {
      if (repoString) {
        const parts: string[] = repoString.split('/')
        trace('Parts: ' + parts)
        if (parts.length === 3) {
          const sgCodeHost = parts[0];
          trace(`sgCodeHost: ${sgCodeHost}`)
          const codeHostKey: string | undefined = this.searchSettings.codeHosts[sgCodeHost]

          const codeHost = this.settings.codeHosts[codeHostKey]
          const searchHost = this.searchHostKey;
          const owner = parts[1];
          const repoName = parts[2];
          const cloneURL = cloneUrl(codeHost, owner, repoName)
          return ({
            searchHost,
            codeHost: codeHostKey ?? sgCodeHost,
            owner,
            repo: repoName,
            sshClone: cloneURL,
          })
        }
      }
    } catch (e) {
      error(`Failed parsing repoString into a SearchHit: ${asString(e)}`)
    }
    return undefined
  }
}

export function useSourceGraphClient(
  props: SourceGraphSearchFieldProps,
): SourceGraphClientWrapper {
  const {settings, search:{searchHostKey}} = useContext(MegaContext);
  const [wrapper, setWrapper] = useState<SourceGraphClientWrapper>({error: 'Not yet initialized', client: undefined})
  useEffect(() => {
    (async () => {
      if (!searchHostKey) {
        setWrapper({error: 'searchHostKey not set/initialized', client: undefined});
        return;
      } else if (!props) {
        setWrapper({error: 'props not set/initialized', client: undefined});
        return;
      } else if (!settings) {
        setWrapper({error: 'settings not set/initialized', client: undefined});
        return;
      }
      const sourceGraphSettings = settings?.searchHosts[searchHostKey]?.sourceGraph
      if (!sourceGraphSettings) {
        setWrapper({error: 'sourceGraphSettings is not defined', client: undefined});
        return;
      }
      const username = sourceGraphSettings.username;
      if (!username) {
        setWrapper({error: 'username is not defined', client: undefined});
        return;
      }
      const baseUrl = sourceGraphSettings.baseUrl;
      if (!baseUrl) {
        setWrapper({error: 'baseUrl is not defined', client: undefined});
        return;
      }
      const password = await getPassword(username, baseUrl)
      if (!password) {
        setWrapper({error: 'password is not defined', client: undefined});
        return;
      }
      setWrapper({
        error: undefined,
        client: new SourceGraphClient(password, baseUrl, searchHostKey, sourceGraphSettings, props, settings)
      })
    })()
  }, [props, searchHostKey, settings])
  return wrapper;
}
