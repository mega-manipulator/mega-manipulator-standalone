import {MegaSettingsType} from "./MegaContext";
import React, {useMemo, useState} from "react";
import {loadFromDiskOrDefault, saveToDisk} from "./settings";

export const useMegaSettings: () => MegaSettingsType = () => {
  return loadFromDiskOrDefault()
}

export const useMutableMegaSettings: () => { megaSettings: MegaSettingsType, updateMegaSettings: (fn: (draft: MegaSettingsType) => void) => void } = () => {
  const [reload, setReload] = useState(0)
  const megaSettings = useMemo(() => useMegaSettings(), [reload])
  const updateMegaSettings = (fn: (draft: MegaSettingsType) => void) => {
    fn(megaSettings)
    saveToDisk(megaSettings)
    setReload(reload + 1)
  }
  return {megaSettings, updateMegaSettings}
}


