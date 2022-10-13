import {MegaContextType, MegaSettingsType} from "./MegaContext";
import React, {useEffect, useState} from "react";
import {SettingsPage} from "../ui/settings/SettingsPage";
import {debug, error, info, trace} from "tauri-plugin-log-api";
import {Store} from 'tauri-plugin-store-api';

const store = new Store('.settings.dat');
const defaultSettings: () => MegaSettingsType = () => {
  return {
    version: '1',
    theme: 'dark',
    searchHosts: {
      "github.com": {
        type: "GITHUB",
      }
    },
    codeHosts: {
      "github.com": {
        type: 'GITHUB',
      }
    },
  }
}

export function useMegaContext(): MegaContextType {
  const [loaded, setLoaded] = useState(false)
  const [settings, setSettings] = useState<MegaSettingsType>(defaultSettings())
  useEffect(() => {
    (async () => {
      if (loaded) {
        store.set('settings', settings)
          .then(() => info('Saved settings'))
          .catch((e) => error(`Failed storing settings: ${e}`))
      } else {
        let loadedSettings: any = await store.get('settings')
        if (loadedSettings !== undefined && loadedSettings instanceof MegaSettingsType) {
          setSettings(loadedSettings)
          info('Loaded settings from file')
        }
        setLoaded(true)
      }
    })()
  }, [settings, loaded])
  const [pageHead, setPageHead] = useState('Settings')
  const [page, setPage] = useState(<SettingsPage/>)
  const updateSettings: (a: (draft: MegaSettingsType) => void) => void = (a: (draft: MegaSettingsType) => void) => {
    a(settings)
    setSettings(settings)
  }
  const wipeSettings = () => {
    setSettings(defaultSettings())
  }

  return {
    settings: {value: settings, update: updateSettings, wipe: wipeSettings},
    pageHead: pageHead,
    page: page,
    navigatePage: (pageHead: string, page: JSX.Element) => {
      trace(`Going to ${pageHead}`)
      setPageHead(pageHead);
      setPage(page);
    },
  }
}
