import {createContext, useEffect, useState} from "react";
import {baseSettings, loadFromDiskOrDefault, MegaSettingsType, saveToDisk} from "./settings";
import {SearchHit} from "../ui/search/types";
import {homeDir} from '@tauri-apps/api/path';

export interface MegaContext {
  settings: MegaSettingsType,
  updateSettings: (fn: (draft: MegaSettingsType) => Promise<void>) => Promise<void>,

  homeDir: string,

  search: {
    searchHostKey: string,
    setSearchHostKey: (codeHostKey: string) => void,
    hits: SearchHit[],
    setHits: (hits: SearchHit[]) => void,
    selected: SearchHit[],
    setSelected: (selected: SearchHit[]) => void,
  }
  clones: {
    paths: string[],
    setPaths: (paths: string[]) => void,
    selected: string[],
    setSelected: (paths: string[]) => void,
  }
  code: {
    codeHostKey: string,
    setCodeHostKey: (codeHostKey: string) => void,
  },
  pullRequests: {
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
  homeDir: '~',
  search: {
    searchHostKey: 'string',
    setSearchHostKey: (codeHostKey: string) => {
    },
    hits: [],
    setHits: (hits: SearchHit[]) => {
    },
    selected: [],
    setSelected: (selected: SearchHit[]) => {
    },
  },
  clones: {
    paths: [],
    setPaths: (paths: string[]) => {
    },
    selected: [],
    setSelected: (selected: string[]) => {
    },
  },
  code: {
    codeHostKey: 'string',
    setCodeHostKey: (codeHostKey: string) => {
    },
  },
  pullRequests: {
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

  const [prHits, setPrHits] = useState<SearchHit[]>([])
  const [prHitsSelected, setPrHitsSelected] = useState<SearchHit[]>([])

  const [homedir, setHomeDir] = useState<string>('~');
  useEffect(() => {
    homeDir().then((d) => setHomeDir(d))
  }, []);

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
  const [searchHostKey, setSearchHostKey] = useState<string>('local');
  const [codeHostKey, setCodeHostKey] = useState<string>('github.com');
  const [clonePaths, setClonePaths] = useState<string[]>([]);
  const [selectedClonePaths, setSelectedClonePaths] = useState<string[]>([]);
  return {
    settings,
    updateSettings,
    homeDir: homedir,
    search: {
      searchHostKey,
      setSearchHostKey,
      hits: searchHits,
      setHits: setSearchHits,
      selected: searchHitsSelected,
      setSelected: setSearchHitsSelected,
    },
    clones: {
      paths: clonePaths,
      setPaths: setClonePaths,
      selected: selectedClonePaths,
      setSelected: setSelectedClonePaths,
    },
    code: {
      codeHostKey,
      setCodeHostKey,
    },
    pullRequests: {
      hits: prHits,
      setHits: setPrHits,
      selected: prHitsSelected,
      setSelected: setPrHitsSelected,
    },
  }
}
