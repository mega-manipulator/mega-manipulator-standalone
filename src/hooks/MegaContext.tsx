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
  baseUrl: string,
  codeHostKey: string,
}
export type CodeHostType = 'GITHUB'
export type CodeHostSettings = {
  type: CodeHostType,
  github?: GitHubCodeHostSettings,
}
export type GitHubCodeHostSettings = {
  username?: string,
  baseUrl: string,
}
