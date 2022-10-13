import React from "react";

export type MegaTheme = 'dark' | 'light'

export class MegaSettingsType {
  version: '1' = '1';
  theme: MegaTheme = "dark";
  keepLocalReposPath?: string = undefined;
  clonePath?: string = undefined;
  searchHosts: { [key: string]: SearchHostSettings, } = {};
  codeHosts: { [key: string]: CodeHostSettings, } = {};
}

export type SearchHostType = 'GITHUB'
export type SearchHostSettings = {
  type: SearchHostType,
  github?: GitHubSearchHostSettings,
}
export type GitHubSearchHostSettings = {
  username?: string,
}
export type CodeHostType = 'GITHUB'
export type CodeHostSettings = {
  type: CodeHostType,
  github?: GitHubCodeHostSettings,
}
export type GitHubCodeHostSettings = {
  username?: string,
}

export type MegaContextType = {
  settings: { value: MegaSettingsType, update: (fn:(settingsDraft: MegaSettingsType) => void) => void, wipe: () => void },
  pageHead: string,
  page: JSX.Element,
  navigatePage: (pageHead: string, page: JSX.Element) => void
}

export const MegaContext = React.createContext<MegaContextType>({
  page: <></>,
  pageHead: '',
  navigatePage: (pageHead: string, page: JSX.Element) => {
  },
  settings: {
    value: {
      version: '1',
      theme: 'dark',
      codeHosts: {},
      searchHosts: {},
    },
    update: (fn:(settingsDraft: MegaSettingsType) => void) => {
    },
    wipe: () => {}
  }
})
