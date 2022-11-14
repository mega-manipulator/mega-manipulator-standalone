import {createContext, useEffect, useState} from "react";
import {baseSettings, loadFromDiskOrDefault, MegaSettingsType, saveToDisk} from "./settings";
import {SearchHit} from "../ui/search/types";

export interface MegaContext {
  settings: MegaSettingsType,
  updateSettings: (fn: (draft: MegaSettingsType) => Promise<void>) => Promise<void>,

  search: {
    hits: SearchHit[],
    setHits: (hits: SearchHit[]) => void,
    selected: SearchHit[],
    setSelected: (selected: SearchHit[]) => void,
  }
}

export const MegaContext = createContext<MegaContext>({
  settings: baseSettings(),
  updateSettings: (fn: (draft: MegaSettingsType) => Promise<void>) => new Promise(() => {
  }),
  search: {
    hits: [],
    setHits: (hits: SearchHit[]) => {
    },
    selected: [],
    setSelected: (selected: SearchHit[]) => {
    },
  }
});

export function newMegaContext(): MegaContext {
  const [settings, setSettings] = useState(baseSettings())
  const [reload, setReload] = useState(0)
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const [searchHitsSelected, setSearchHitsSelected] = useState<SearchHit[]>([])
  useEffect(() => {
    setSearchHitsSelected([])
  }, [searchHits, reload]);

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
  return {
    settings,
    updateSettings,

    search: {
      hits: searchHits,
      setHits: setSearchHits,
      selected: searchHitsSelected,
      setSelected: setSearchHitsSelected,
    },
  }
}
