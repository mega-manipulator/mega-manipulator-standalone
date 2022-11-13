import {createContext, useEffect, useState} from "react";
import {baseSettings, loadFromDiskOrDefault, MegaSettingsType, saveToDisk} from "./settings";

export interface MegaContext {
  settings: MegaSettingsType,
  updateSettings: (fn:(draft:MegaSettingsType)=>Promise<void>) => Promise<void>
}

export const MegaContext = createContext<MegaContext>({settings:baseSettings(), updateSettings:(fn:(draft:MegaSettingsType) => Promise<void>) => new Promise(()=>{})});

export function newMegaContext():MegaContext {
  const [settings, setSettings] = useState(baseSettings())
  const [reload, setReload] = useState(0)
  useEffect(() => {
    loadFromDiskOrDefault().then((d) => setSettings(d))
  }, [reload])
  const updateSettings = async (fn: (draft: MegaSettingsType) => void) => {
    const megaSettings = await loadFromDiskOrDefault()
    fn(megaSettings)
    setSettings(megaSettings)
    saveToDisk(megaSettings)
    setReload(reload + 1)
  }
  return {settings, updateSettings}
}
