import {cloneUrl, MegaSettingsType, SourceGraphSearchHostSettings} from "../../../hooks/settings";
import {SourceGraphSearchFieldProps} from "./SourceGraphSearchField";
import {useContext, useEffect, useState} from "react";
import {getPassword} from "../../../hooks/usePassword";
import axios from "axios";
import {debug, error, warn} from "tauri-plugin-log-api";
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
  readonly searchSettings: SourceGraphSearchHostSettings;
  readonly props: SourceGraphSearchFieldProps;
  readonly settings: MegaSettingsType;

  constructor(
    token: string,
    baseUrl: string,
    searchSettings: SourceGraphSearchHostSettings,
    props: SourceGraphSearchFieldProps,
    settings: MegaSettingsType,
  ) {
    this.token = token;
    this.baseUrl = baseUrl;
    this.searchSettings = searchSettings;
    this.props = props;
    this.settings = settings;
  }

  async searchCode(searchString: string, max?: number): Promise<SearchHit[]> {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    const handle: SourceGraphSearchHandle = {
      cancel: () => {
        return;
      },
    };
    handle.cancel = () => {
      source.cancel('Manual cancel by user');
    };
    const selfRef: SourceGraphClient = this;
    const searchHits = new Set<SearchHit>();
    try {
      debug('Requesting data from sourcegraph')
      const response = await axios({
        method: "POST",
        url: `${selfRef.searchSettings.baseUrl}/.api/graphql`,
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

      debug('response?.data?.data?.search?.results?.results' + asString(response?.data?.data?.search?.results?.results))
      response?.data?.data?.search?.results?.results?.forEach((item: any) => {
        if (searchHits.size === max)
          return;
        let hit: SearchHit | undefined = undefined;
        debug('Evaluating result item: ' + asString(item))
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
      selfRef.props.searchFieldProps.setState("ready")

    }
    const hits = Array.from(searchHits.values());
    debug('Response handle received for GraphQL response: ' + asString(hits.length))
    return hits;
  }

  private sgRepoStringToSearchHit(repoString?: string): SearchHit | undefined {
    try {

      if (repoString) {
        const parts: string[] = repoString.split('/')
        debug('Parts: ' + parts)
        if (parts.length === 3) {
          // TODO: Get our code host from sourceGraph code host
          const sgCodeHost = parts[0];
          debug(`sgCodeHost: ${sgCodeHost}`)
          const codeHostKey = this.searchSettings.codeHosts[sgCodeHost]
          if (!codeHostKey) throw new Error(`CodeHost '${sgCodeHost}->${codeHostKey}' not mapped, ${asString(this.searchSettings.codeHosts)}`)

          const codeHost = this.settings.codeHosts[codeHostKey]
          const searchHost = this.props.searchFieldProps.searchHostKey;
          const owner = parts[1];
          const repoName = parts[2];
          const cloneURL = cloneUrl(codeHost, owner, repoName)
          if (!cloneURL) {
            throw new Error('Unable to resolve clone url for repo: ' + searchHost + '/' + codeHostKey + '/' + owner + '/' + repoName)
          }
          return ({
            searchHost,
            codeHost: codeHostKey,
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
  const {settings} = useContext(MegaContext);
  const [wrapper, setWrapper] = useState<SourceGraphClientWrapper>({error: 'Not yet initialized', client: undefined})
  useEffect(() => {
    (async () => {
      if (!props?.searchFieldProps?.searchHostKey) {
        setWrapper({error: 'searchHostKey not set/initialized', client: undefined});
        return;
      } else if (!props) {
        setWrapper({error: 'props not set/initialized', client: undefined});
        return;
      } else if (!settings) {
        setWrapper({error: 'settings not set/initialized', client: undefined});
        return;
      }
      const sourceGraphSettings = settings?.searchHosts[props?.searchFieldProps?.searchHostKey]?.sourceGraph
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
        client: new SourceGraphClient(password, baseUrl, sourceGraphSettings, props, settings)
      })
    })()
  }, [props, props?.searchFieldProps?.searchHostKey, settings])
  return wrapper;
}
