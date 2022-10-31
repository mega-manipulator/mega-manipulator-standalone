import React from "react";

export type MegaTheme = 'dark' | 'light'

export type HostType = 'SEARCH' | 'CODE';

export interface UserLoginType {
  hostType: HostType;
  username?: string;
  baseUrl?: string;
}

export class MegaSettingsType {
  version: '1' = '1';
  theme: MegaTheme = "dark";
  keepLocalReposPath?: string = undefined;
  clonePath?: string = undefined;
  searchHosts: { [key: string]: SearchHostSettings, } = {};
  codeHosts: { [key: string]: CodeHostSettings, } = {};
  constructor() {
  }
}

export type SearchHostType = 'GITHUB' | 'LOCAL'
export type SearchHostSettings = {
  type: SearchHostType,
  github?: GitHubSearchHostSettings,
  local?:LocalSearchHostSettings
}

export interface LocalSearchHostSettings {
  program: 'ag' | 'grep' | 'ripgrep'
}

export interface GitHubSearchHostSettings extends UserLoginType {
  codeHostKey: string;
}

export type CodeHostType = 'GITHUB'
export type CodeHostSettings = {
  type: CodeHostType,
  github?: GitHubCodeHostSettings,
}

export interface GitHubCodeHostSettings extends UserLoginType {
}
