import {createContext, useEffect, useMemo, useState} from "react";
import {baseSettings, loadFromDiskOrDefault, MegaSettingsType, saveToDisk} from "./settings";
import {SearchHit} from "../ui/search/types";
import {homeDir} from '@tauri-apps/api/path';
import {GitHubPull} from "./github.com";

export interface MegaContext {
  settings: MegaSettingsType,
  updateSettings: (fn: (draft: MegaSettingsType) => Promise<void>) => Promise<void>,

  homeDir: string,

  fieldMemory: {
    [key: string]: string[]
  }
  setFieldMemory: (memory: {
    [key: string]: string[]
  }) => void;

  search: {
    searchHostKey: string,
    setSearchHostKey: (codeHostKey: string) => void,
    hits: SearchHit[],
    setHits: (hits: SearchHit[]) => void,
    selected: SearchHit[],
    selectedModel: number[],
    setSelected: (selected: number[]) => void,
  }
  clones: {
    paths: string[],
    setPaths: (paths: string[]) => void,
    selected: string[],
    selectedModel: number[],
    setSelected: (paths: number[]) => void,
  }
  code: {
    codeHostKey: string,
    setCodeHostKey: (codeHostKey: string) => void,
  },
  pullRequests: {
    pulls: GitHubPull[],
    setPulls: (pulls: GitHubPull[]) => void,
    selected: GitHubPull[],
    selectedModel: number[],
    setSelected: (selected: number[]) => void,
  }
}

export const MegaContext = createContext<MegaContext>({
  settings: baseSettings(),
  updateSettings: () => new Promise(() => {
    return;
  }),
  homeDir: '~',
  fieldMemory: {
    "foo": ["asd"]
  },
  setFieldMemory: () => {
    return;
  },
  search: {
    searchHostKey: 'string',
    setSearchHostKey: () => {
      return;
    },
    hits: [],
    setHits: () => {
      return;
    },
    selected: [],
    selectedModel: [],
    setSelected: () => {
      return;
    },
  },
  clones: {
    paths: [],
    setPaths: () => {
      return;
    },
    selected: [],
    selectedModel: [],
    setSelected() {
      return;
    },
  },
  code: {
    codeHostKey: 'string',
    setCodeHostKey: () => {
      return;
    },
  },
  pullRequests: {
    pulls: [],
    setPulls: () => {
      return;
    },
    selected: [],
    selectedModel: [],
    setSelected: () => {
      return;
    },
  }
});

export function useMegaContext(): MegaContext {
  const [settings, setSettings] = useState(baseSettings())
  const [reload, setReload] = useState(0)

  /* Search Hits */
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const [searchHitsSelectedModel, setSearchHitsSelectedModel] = useState<number[]>([])
  const searchHitsSelected = useMemo<SearchHit[]>(() => {
    return searchHitsSelectedModel.map((i) => searchHits[i])
  }, [searchHits, searchHitsSelectedModel])

  /* Pull requests */
  const [prHits, setPrHits] = useState<GitHubPull[]>([])
  const [prHitsSelectedModel, setPrHitsSelectedModel] = useState<number[]>([])
  const prHitsSelected = useMemo<GitHubPull[]>(() => {
    return prHitsSelectedModel.map((i) => prHits[i])
  }, [prHitsSelectedModel, prHits])

  const [homedir, setHomeDir] = useState<string>('~');
  useEffect(() => {
    homeDir().then((d) => setHomeDir(d))
  }, []);

  const [fieldMemory, setFieldMemory] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    loadFromDiskOrDefault().then((d) => setSettings(d))
  }, [reload])
  const updateSettings = async (fn: (_draft: MegaSettingsType) => void) => {
    const megaSettings = await loadFromDiskOrDefault()
    fn(megaSettings)
    setSettings(megaSettings)
    saveToDisk(megaSettings)
    setReload(reload + 1)
  }
  const [searchHostKey, setSearchHostKey] = useState<string>('LOCAL');
  const [codeHostKey, setCodeHostKey] = useState<string>('github.com');

  /* Clone Paths*/
  const [clonePaths, setClonePaths] = useState<string[]>([]);
  const [selectedClonePathsModel, setSelectedClonePathsModel] = useState<number[]>([]);
  const selectedClonePaths = useMemo<string[]>(() => {
    return selectedClonePathsModel.map((i) => clonePaths[i])
  }, [clonePaths, selectedClonePathsModel]);

  useEffect(() => {
    if (searchHitsSelectedModel.length !== 0 && (searchHitsSelectedModel.length !== searchHits.length))
      setSearchHitsSelectedModel([])
    if (prHitsSelectedModel.length !== 0 && prHitsSelectedModel.length !== prHits.length)
      setPrHitsSelectedModel([])
    if (selectedClonePathsModel.length !== 0 && selectedClonePathsModel.length !== clonePaths.length)
      setSelectedClonePathsModel([])
  }, [searchHits, clonePaths, prHits, reload, searchHitsSelectedModel.length, prHitsSelectedModel.length, selectedClonePathsModel.length]);
  return {
    settings,
    updateSettings,
    homeDir: homedir,
    fieldMemory,
    setFieldMemory,
    search: {
      searchHostKey,
      setSearchHostKey,
      hits: searchHits,
      setHits: setSearchHits,
      selected: searchHitsSelected,
      selectedModel: searchHitsSelectedModel,
      setSelected: setSearchHitsSelectedModel,
    },
    clones: {
      paths: clonePaths,
      setPaths: setClonePaths,
      selected: selectedClonePaths,
      selectedModel: selectedClonePathsModel,
      setSelected: setSelectedClonePathsModel,
    },
    code: {
      codeHostKey,
      setCodeHostKey,
    },
    pullRequests: {
      pulls: prHits,
      setPulls: setPrHits,
      selected: prHitsSelected,
      selectedModel: prHitsSelectedModel,
      setSelected: setPrHitsSelectedModel,
    },
  }
}
