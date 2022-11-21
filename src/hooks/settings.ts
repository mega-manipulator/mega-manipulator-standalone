import {Store} from "tauri-plugin-store-api";
import {homeDir} from "@tauri-apps/api/path";
import {path} from "@tauri-apps/api";

const store = new Store('.settings.dat');
const nodeName = 'settings'

export const baseSettings: () => MegaSettingsType = () => {
  return {
    version: '1',

    keepLocalReposPath: '~/vcs/mega-manipulator/keep',
    clonePath: '~/vcs/mega-manipulator/work',
    editorApplication: '/Applications/Visual Studio Code.app',

    searchHosts: {
      "github.com": {
        type: "GITHUB",
        github: {
          hostType: "SEARCH",
          username: 'jensim',
          baseUrl: 'https://api.github.com',
          codeHostKey: 'github.com',
        }
      },
      "sourcegraph.com": {
        type: 'SOURCEGRAPH',
        sourceGraph: {
          username: 'OnlyNeededForMultipleUsernames',
          hostType: "SEARCH",
          baseUrl: "https://sourcegraph.com",
          codeHosts: {
            "github.com": "github.com",
          },
        },
      },
    },
    codeHosts: {
      "github.com": {
        type: 'GITHUB',
        github: {
          cloneHost: 'github.com',
          hostType: "CODE",
          username: 'jensim',
          baseUrl: 'https://api.github.com',
        }
      }
    }
  }
}

export async function defaultSettings(): Promise<MegaSettingsType> {
  const settings = baseSettings();
  if (typeof window.__TAURI_IPC__ === 'function') {
    const home = await homeDir()
    settings.keepLocalReposPath = await path.join(home, 'vcs', 'mega-manipulator-keep');
    settings.clonePath = await path.join(home, 'vcs', 'mega-manipulator-workdir');
  }
  return settings;
}

/**
 * This will effectively wipe all settings
 */
export async function createDefault(): Promise<MegaSettingsType> {
  const defaultVal = await defaultSettings();
  saveToDisk(defaultVal)
  return defaultVal
}

export function saveToDisk(settings: MegaSettingsType) {
  if (typeof window.__TAURI_IPC__ === 'function') {
    (async () => {
      await store.set(nodeName, settings)
    })()
  }
}

export async function loadFromDiskOrDefault(): Promise<MegaSettingsType> {
  const megaSettings = await defaultSettings();

  if (typeof window.__TAURI_IPC__ === 'function') {
    let loadedSettings: any = await store.get(nodeName)
    if (loadedSettings) {
      Object.assign(megaSettings, loadedSettings)
    }
  }
  return megaSettings;
}

export type HostType = 'SEARCH' | 'CODE';

export interface UserLoginType {
  hostType: HostType;
  username: string;
  baseUrl: string;
}

export interface MegaSettingsType {
  version: '1';
  keepLocalReposPath: string;
  clonePath: string;
  editorApplication: string,
  searchHosts: { [key: string]: SearchHostSettings, };
  codeHosts: { [key: string]: CodeHostSettings, };
}

export type SearchHostType = 'GITHUB' | 'SOURCEGRAPH'
export type SearchHostSettings = {
  type: SearchHostType,
  github?: GitHubSearchHostSettings,
  sourceGraph?: SourceGraphSearchHostSettings,
}

export interface GitHubSearchHostSettings extends UserLoginType {
  codeHostKey: string;
}

export interface SourceGraphSearchHostSettings extends UserLoginType {
  baseUrl: string;
  codeHosts: {
    [sourceGraphKey: string]: string;
  }
}

export type CodeHostType = 'GITHUB'
export type CodeHostSettings = {
  type: CodeHostType,
  github?: GitHubCodeHostSettings,
}

export function cloneUrl(settings: CodeHostSettings | undefined, owner: string, repo: string): string | undefined {
  switch (settings?.type) {
    case "GITHUB":
      return ghCloneUrl(settings.github?.cloneHost ?? 'github.com', owner, repo)
  }
  return undefined
}

export interface GitHubCodeHostSettings extends UserLoginType {
  baseUrl: string;
  cloneHost: string;
  hostType: HostType;
  username: string;
}

function ghCloneUrl(host: string, owner: string, repo: string): string | undefined {
  // TODO work with settings for location other than github.com
  return `git@${host}:${owner}/${repo}.git`
}
