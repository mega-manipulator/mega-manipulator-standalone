import {GithubClient} from "../../../hooks/github.com";
import {GitHubCodeHostSettings, GitHubSearchHostSettings, MegaSettingsType} from "../../../hooks/settings";
import {getPassword} from "../../../hooks/usePassword";
import {useContext, useEffect, useState} from "react";
import {MegaContext} from "../../../hooks/MegaContext";

export interface GithubClientWrapper {
  ghClient?: GithubClient,
  clientInitError?: string,
}

async function bakeGithubClient(
  searchHostKey: string,
  codeHostKey: string,
  megaSettings: MegaSettingsType,
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
    ghClient: new GithubClient(
      baseUrl,
      username,
      token,
      searchHostKey,
      codeHostKey,
      megaSettings,
    )
  }
}

export const useGitHubSearchClient: () => GithubClientWrapper = () => {
  const {settings, search: {searchHostKey}} = useContext(MegaContext);
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
        setWrapper({clientInitError: 'Undefined search host settings 🤔'})
        return;
      }
      setWrapper(await bakeGithubClient(searchHostKey, hostSetting.codeHostKey, settings, hostSetting))
    })()
  }, [searchHostKey, settings])
  return wrapper
}


export const useGitHubCodeClient: () => GithubClientWrapper = () => {
  const {settings, code: {codeHostKey}} = useContext(MegaContext);
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
        setWrapper({clientInitError: 'Undefined search host settings 🤔'})
        return;
      }
      setWrapper(await bakeGithubClient('??', codeHostKey, settings, hostSetting))
    })()
  }, [codeHostKey, settings])
  return wrapper
}
