import {MegaSettingsType} from "./MegaContext";
import React, {useEffect, useState} from "react";
import {loadFromDiskOrDefault, saveToDisk} from "./settings";
import {asString} from "./logWrapper";
import {error} from "tauri-plugin-log-api";

export const useMegaSettings: () => MegaSettingsType | null = () => {
  const [settings, setSettings] = useState<MegaSettingsType | null>(null)
  useEffect(() => {
    loadFromDiskOrDefault()
      .then((d) => {
        setSettings(d)
      })
      .catch((e) => error(`Failed to load settings from disk! ${asString(e)}`))
  }, [])
  return settings;
}

export const useMutableMegaSettings: () => { megaSettings: MegaSettingsType | null; updateMegaSettings: (fn: (draft: MegaSettingsType) => void) => Promise<void> } = () => {
  const [reload, setReload] = useState(0)
  const [megaSettings, setMegaSettings] = useState<MegaSettingsType | null>(null)
  useEffect(() => {
    loadFromDiskOrDefault().then((d) => setMegaSettings(d))
  }, [reload])

  const updateMegaSettings = async (fn: (draft: MegaSettingsType) => void) => {
    const megaSettings = await loadFromDiskOrDefault()
    fn(megaSettings)
    saveToDisk(megaSettings)
    setReload(reload + 1)
  }
  return {megaSettings, updateMegaSettings}
}


