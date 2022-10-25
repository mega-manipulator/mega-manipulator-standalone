import {Store} from "tauri-plugin-store-api";
import {MegaSettingsType} from "./MegaContext";
import {homeDir} from "@tauri-apps/api/path";
import {path} from "@tauri-apps/api";

const store = new Store('.settings.dat');
const nodeName = 'settings'

export async function defaultSettings(): Promise<MegaSettingsType> {
  const settings = new MegaSettingsType();
  if (typeof window.__TAURI_IPC__ === 'function') {
    const home = await homeDir()
    settings.keepLocalReposPath = await path.join(home, 'vcs');
    settings.clonePath = await path.join(home, 'vcs', 'mega-manipulator-workdir');
  } else {
    settings.keepLocalReposPath = '~/vcs';
    settings.clonePath = '~/vcs/mega-manipulator-workdir';
  }
  settings.searchHosts = {
    "github.com": {
      type: "GITHUB",
      github: {
        hostType: "SEARCH",
        username: 'jensim',
        baseUrl: 'https://api.github.com',
        codeHostKey: 'github.com',
      }
    }
  }
  settings.codeHosts = {
    "github.com": {
      type: 'GITHUB',
      github: {
        hostType: "CODE",
        username: 'jensim',
        baseUrl: 'https://api.github.com',
      }
    }
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
