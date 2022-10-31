import {SearchClient} from "./types";
import {useEffect, useState} from "react";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {GithubClient} from "../../hooks/github.com";
import {GitHubSearchHostSettings, LocalSearchHostSettings, MegaSettingsType} from "../../hooks/MegaContext";
import {getPassword} from "../../hooks/usePassword";
import {LocalSearchClient} from "./LocalSearchClient";

export interface SearchClientWrapper {
  searchClient?: SearchClient,
  searchClientInitError?: string,
}

async function bakeGithubClient(
  searchHostKey: string,
  settings?: GitHubSearchHostSettings,
): Promise<SearchClientWrapper> {
  if (!settings) {
    return {searchClientInitError: 'Undefined search host settings 🤔'}
  }
  const baseUrl = settings.baseUrl
  if (!baseUrl) {
    return {searchClientInitError: 'BaseUrl not set, go back to settings to set it'}
  }
  const username = settings.username
  if (!username) {
    return {searchClientInitError: 'Username not set, go back to settings to set it'}
  }
  const token = await getPassword(username, baseUrl)
  if (!token) {
    return {searchClientInitError: 'Token not saved, go back to settings to set it'}
  }
  return {
    searchClient: new GithubClient(
      baseUrl,
      username,
      token,
      searchHostKey,
      settings.codeHostKey
    )
  }
}

async function bakeLocalClient(settings: MegaSettingsType, localSettings?: LocalSearchHostSettings): Promise<SearchClientWrapper> {
  if (localSettings) {
    return {searchClient: new LocalSearchClient(settings, localSettings)}
  } else {
    return {searchClientInitError: 'No settings defined, you might need to reset your settings.'}
  }
}

export const useSearchClient: (searchHostKey: string | null) => SearchClientWrapper = (searchHostKey) => {
  const [wrapper, setWrapper] = useState<SearchClientWrapper>({searchClientInitError: 'Not initialized'})
  const settings: MegaSettingsType | null = useMegaSettings()
  useEffect(() => {
    (async () => {
      if (searchHostKey === null) {
        setWrapper({searchClientInitError: 'Search host key not set'})
        return;
      }
      if (settings === null) {
        setWrapper({searchClientInitError: 'Settings not loaded yet'})
        return;
      }
      const hostSetting = settings.searchHosts[searchHostKey]
      switch (hostSetting?.type) {
        case undefined:
          setWrapper({searchClientInitError: `No settings for search host key '${searchHostKey}'`})
          return;
        case "GITHUB":
          const githubClient = await bakeGithubClient(searchHostKey, hostSetting.github);
          setWrapper(githubClient)
          return;
        case 'LOCAL':
          const localClient = await bakeLocalClient(settings, hostSetting.local)
          setWrapper(localClient)
      }
    })()
  }, [searchHostKey, settings])
  return wrapper
}
