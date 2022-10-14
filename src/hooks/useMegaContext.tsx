import {MegaContextType, MegaSettingsType} from "./MegaContext";
import React, {useEffect, useState} from "react";
import {SettingsPage} from "../ui/settings/SettingsPage";
import {error, info, trace} from "tauri-plugin-log-api";
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
        info(`Saving settings ${JSON.stringify(settings)}`)
        store.set('settings', settings)
          .then(() => info('Saved settings'))
          .catch((e) => error(`Failed storing settings: ${e}`))
      } else {
        try {
          info('Loading settings')
          let loadedSettings: any = await store.get('settings')
          if (loadedSettings === undefined) {
            info(`Didn't load settings, none found`)
          } else if (loadedSettings instanceof MegaSettingsType) {
            info(`Didn't load settings, was not able to determine type`)
          } else {
            setSettings(loadedSettings)
            info(`Loaded settings from file: ${JSON.stringify(loadedSettings)}`)
          }
          setLoaded(true)
        } catch (e) {
          error(`Failed loading settings due to: ${e}`)
        }
      }
    })()
  }, [settings])
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
