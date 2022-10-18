import {Store} from "tauri-plugin-store-api";
import {MegaSettingsType} from "./MegaContext";

const store = new Store('.settings.dat');
const nodeName = 'settings'

export function defaultSettings(): MegaSettingsType {
  return {
    version: '1',
    theme: 'dark',
    keepLocalReposPath: '~/vcs',
    clonePath: '~/vcs/mega-manipulator-workdir',
    searchHosts: {
      "github.com": {
        type: "GITHUB",
        github: {
          username: 'jensim',
          baseUrl: 'https://api.github.com',
          codeHostKey: 'github.com',
        }
      }
    },
    codeHosts: {
      "github.com": {
        type: 'GITHUB',
        github: {
          username: 'jensim',
          baseUrl: 'https://api.github.com',
        }
      }
    },
  };
}

/**
 * This will effectively wipe all settings
 */
export function createDefault(): MegaSettingsType {
  const defaultVal = defaultSettings();
  saveToDisk(defaultVal)
  return defaultVal
}

export function saveToDisk(settings: MegaSettingsType) {
  if(typeof window.__TAURI_IPC__ === 'function') {
    (async () => {
      await store.set(nodeName, settings)
    })()
  }
}

export function loadFromDiskOrDefault(): MegaSettingsType {
  let loadedSettings: any
  if(typeof window.__TAURI_IPC__ === 'function') {
    (async () => {
      loadedSettings = await store.get(nodeName)
    })();
  }
  if (loadedSettings === undefined) {
    return createDefault();
  } else if (loadedSettings instanceof MegaSettingsType) {
    return loadedSettings
  } else {
    throw 'Failed loading settings, stored settings are not compatible with expected format'
  }
}
