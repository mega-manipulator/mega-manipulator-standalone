import {SearchClient} from "./types";
import {useEffect, useState} from "react";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {GithubClient} from "../../hooks/github.com";
import {GitHubSearchHostSettings, MegaSettingsType} from "../../hooks/MegaContext";
import {getPassword} from "../../hooks/usePassword";

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

export const useSearchClient: (searchHostKey: string | undefined) => SearchClientWrapper = (searchHostKey) => {
  const [wrapper, setWrapper] = useState<SearchClientWrapper>({searchClientInitError: 'Not initialized'})
  const settings: MegaSettingsType | null = useMegaSettings()
  useEffect(() => {
    (async () => {
      if (searchHostKey === undefined) {
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
      }
    })()
  }, [searchHostKey, settings])
  return wrapper
}
