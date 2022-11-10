import {useEffect, useState} from "react";
import {MegaSettingsType} from "../../../hooks/MegaContext";
import {fs, path} from "@tauri-apps/api";
import {debug} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";

export function useCodeHostFilter(settings: MegaSettingsType | null | undefined): string[] {
  const [codeHosts, setCodeHosts] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      if (settings?.clonePath) {
        const dirs: string[] = await getDirNames(settings?.clonePath);
        setCodeHosts(dirs)
      } else {
        setCodeHosts([])
      }
    })()
  }, [settings, settings?.clonePath])
  return codeHosts;
}

export function useOwnerFilter(
  settings: MegaSettingsType | null | undefined,
  codeHost: string,
): string[] {
  const [owners, setOwners] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      if (settings?.clonePath && codeHost !== '*') {
        const p = await path.join(settings.clonePath, codeHost)
        const dirs: string[] = await getDirNames(p);
        setOwners(dirs)
      } else {
        setOwners([])
      }
    })()
  }, [settings, settings?.clonePath, codeHost])
  return owners;
}

export function useRepoFilter(
  settings: MegaSettingsType | null | undefined,
  codeHost: string,
  owner: string,
): string[] {
  const [repos, setRepos] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      if (settings?.clonePath && codeHost && codeHost !== '*' && owner && owner !== '*') {
        const p = await path.join(settings.clonePath, codeHost, owner)
        const dirs: string[] = await getDirNames(p);
        setRepos(dirs)
      } else {
        setRepos([])
      }
    })()
  }, [settings, settings?.clonePath, codeHost, owner])
  return repos;
}

async function getDirNames(p: string): Promise<string[]> {
  const fileEntries = await fs.readDir(p);
  let dirs = fileEntries
    .filter((f) => f.children !== undefined && f.name !== undefined)
    .map((f) => f.name)
    .map((f) => f as string);
  await debug(`Read dir ${p}. It had this content: ${asString(fileEntries)}, these are the dirs: ${asString(dirs)}`)
  return dirs;
}
