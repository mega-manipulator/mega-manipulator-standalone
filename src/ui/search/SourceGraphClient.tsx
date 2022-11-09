import {SourceGraphSearchHostSettings} from "../../hooks/MegaContext";
import {SourceGraphSearchFieldProps} from "./SourceGraphSearchField";
import {useEffect, useState} from "react";
import {getPassword} from "../../hooks/usePassword";
import axios from "axios";
import {debug} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";

export interface SourceGraphClientWrapper {
  client: SourceGraphClient | undefined;
  error: string | undefined;
}

export interface SourceGraphSearchHandle {
  cancel: () => void;
  isCancelled: boolean;
  isDone: boolean;
  matches: any | undefined;
  progress: any | undefined;
  filters: any | undefined;
  alert: any | undefined;
}

export class SourceGraphClient {
  readonly token: string;
  readonly baseUrl: string;
  readonly settings: SourceGraphSearchHostSettings;
  readonly props: SourceGraphSearchFieldProps;

  constructor(token: string, baseUrl: string, settings: SourceGraphSearchHostSettings, props: SourceGraphSearchFieldProps) {
    this.token = token;
    this.baseUrl = baseUrl;
    this.settings = settings;
    this.props = props;
  }

  searchCode(searchString: string, max?: number): SourceGraphSearchHandle {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    const handle: SourceGraphSearchHandle = {
      cancel: () => {
      },
      isCancelled: false,
      isDone: false,
      matches:undefined,
      progress:undefined,
      filters:undefined,
      alert:undefined,
    };
    handle.cancel = () => {
      if (!handle.isCancelled) {
        handle.isCancelled = true;
        if (!handle.isDone) {
          source.cancel('Manual cancel by user');
        }
      }
    };
    (async () => {
      const response = await axios.get(`https://stream.example.com`, {
        headers: {Authorization: `token ${this.token}`},
        responseType: 'stream'
      });

      const stream = response.data
      stream.on('matches', function (data: any) {
        handle.matches = data;
        data = asString(data);
        debug(data);
      });
      stream.on('progress', function (data: any) {
        handle.progress = data;
        data = asString(data);
        debug(data);
      });
      stream.on('filters', function (data: any) {
        handle.filters = data;
        data = asString(data);
        debug(data);
      })
      stream.on('alert', function (data: any) {
        handle.alert = data;
        data = asString(data);
        debug(data);
      })
      stream.on('done', function (data: any) {
        data = asString(data);
        debug(data);
        handle.isDone = true;
      })
    })()
    return handle;
  }
}

export function useSourceGraphClient(
  props: SourceGraphSearchFieldProps | null | undefined,
): SourceGraphClientWrapper {
  const [wrapper, setWrapper] = useState<SourceGraphClientWrapper>({error: 'Not yet initialized', client: undefined})
  useEffect(() => {
    (async () => {
      if (!props?.searchHostKey) {
        setWrapper({error: 'searchHostKey not set/initialized', client: undefined});
        return;
      } else if (!props) {
        setWrapper({error: 'props not set/initialized', client: undefined});
        return;
      } else if (!props?.searchFieldProps?.settings) {
        setWrapper({error: 'settings not set/initialized', client: undefined});
        return;
      }
      const sourceGraphSettings = props?.searchFieldProps?.settings?.searchHosts[props?.searchHostKey]?.sourceGraph
      if (!sourceGraphSettings) {
        setWrapper({error: '', client: undefined});
        return;
      }
      const username = sourceGraphSettings.username;
      if (!username) {
        setWrapper({error: '', client: undefined});
        return;
      }
      const baseUrl = sourceGraphSettings.baseUrl;
      if (!baseUrl) {
        setWrapper({error: '', client: undefined});
        return;
      }
      const password = await getPassword(username, baseUrl)
      if (!password) {
        setWrapper({error: '', client: undefined});
        return;
      }
      setWrapper({error: undefined, client: new SourceGraphClient(password, baseUrl, sourceGraphSettings, props)})
    })()
  }, [props?.searchHostKey, props, props?.searchFieldProps?.settings])
  return wrapper;
}
