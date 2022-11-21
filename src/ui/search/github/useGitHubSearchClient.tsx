import {GithubClient} from "../../../hooks/github.com";
import {GitHubCodeHostSettings, GitHubSearchHostSettings} from "../../../hooks/settings";
import {getPassword} from "../../../hooks/usePassword";
import {useContext, useEffect, useState} from "react";
import {MegaContext} from "../../../hooks/MegaContext";

export interface GithubClientWrapper {
  searchClient?: GithubClient,
  clientInitError?: string,
}

async function bakeGithubClient(
  searchHostKey: string,
  codeHostKey: string,
  settings: GitHubSearchHostSettings | GitHubCodeHostSettings,
): Promise<GithubClientWrapper> {
  const baseUrl = settings.baseUrl
  if (!baseUrl) {
    return {clientInitError: 'BaseUrl not set, go back to settings to set it'}
  }
  const username = settings.username
  if (!username) {
    return {clientInitError: 'Username not set, go back to settings to set it'}
  }
  const token = await getPassword(username, baseUrl)
  if (!token) {
    return {clientInitError: 'Token not saved, go back to settings to set it'}
  }
  return {
    searchClient: new GithubClient(
      baseUrl,
      username,
      token,
      searchHostKey,
      codeHostKey,
    )
  }
}

export const useGitHubSearchClient: (
  searchHostKey: string | undefined,
) => GithubClientWrapper = (searchHostKey) => {
  const {settings} = useContext(MegaContext);
  const [wrapper, setWrapper] = useState<GithubClientWrapper>({clientInitError: 'Not initialized'})
  useEffect(() => {
    (async () => {
      if (!searchHostKey) {
        setWrapper({clientInitError: 'Search host key not set'})
        return;
      }
      if (!settings) {
        setWrapper({clientInitError: 'Settings not loaded yet'})
        return;
      }
      const hostSetting: GitHubSearchHostSettings | undefined = settings.searchHosts[searchHostKey]?.github;
      if (!hostSetting) {
        setWrapper( {clientInitError: 'Undefined search host settings 🤔'})
        return;
      }
      setWrapper(await bakeGithubClient(searchHostKey, hostSetting.codeHostKey, hostSetting))
    })()
  }, [searchHostKey, settings])
  return wrapper
}


export const useGitHubCodeClient: (
  codeHostKey: string | undefined,
) => GithubClientWrapper = (codeHostKey) => {
  const {settings} = useContext(MegaContext);
  const [wrapper, setWrapper] = useState<GithubClientWrapper>({clientInitError: 'Not initialized'})
  useEffect(() => {
    (async () => {
      if (!codeHostKey) {
        setWrapper({clientInitError: 'Code host key not set'})
        return;
      }
      if (!settings) {
        setWrapper({clientInitError: 'Settings not loaded yet'})
        return;
      }
      const hostSetting: GitHubCodeHostSettings | undefined = settings.codeHosts[codeHostKey]?.github;
      if (!hostSetting) {
        setWrapper( {clientInitError: 'Undefined search host settings 🤔'})
        return;
      }
      setWrapper(await bakeGithubClient('??', codeHostKey, hostSetting))
    })()
  }, [codeHostKey, settings])
  return wrapper
}
