import {GithubClient} from "../../hooks/github.com";
import {GitHubSearchHostSettings, MegaSettingsType} from "../../hooks/MegaContext";
import {getPassword} from "../../hooks/usePassword";
import {useEffect, useState} from "react";

export interface GithubClientWrapper {
  searchClient?: GithubClient,
  searchClientInitError?: string,
}

async function bakeGithubClient(
  searchHostKey: string,
  settings: GitHubSearchHostSettings,
): Promise<GithubClientWrapper> {
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

export const useGitHubClient: (
  settings: MegaSettingsType | null | undefined,
  searchHostKey: string | null | undefined,
) => GithubClientWrapper = (settings, searchHostKey) => {
  const [wrapper, setWrapper] = useState<GithubClientWrapper>({searchClientInitError: 'Not initialized'})
  useEffect(() => {
    (async () => {
      if (!searchHostKey) {
        setWrapper({searchClientInitError: 'Search host key not set'})
        return;
      }
      if (!settings) {
        setWrapper({searchClientInitError: 'Settings not loaded yet'})
        return;
      }
      const hostSetting: GitHubSearchHostSettings | undefined = settings.searchHosts[searchHostKey]?.github;
      if (!hostSetting) {
        return {searchClientInitError: 'Undefined search host settings 🤔'}
      }
      return bakeGithubClient(searchHostKey, hostSetting)
    })()
  }, [searchHostKey, settings])
  return wrapper
}
