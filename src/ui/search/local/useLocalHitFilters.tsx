import {useEffect, useState} from "react";
import {MegaSettingsType} from "../../../hooks/settings";
import {fs, path} from "@tauri-apps/api";
import {debug, trace} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";

export function useCodeHostFilter(settings: MegaSettingsType): string[] {
  const [codeHosts, setCodeHosts] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      if (settings?.keepLocalReposPath) {
        const dirs: string[] = await getDirNames(settings?.keepLocalReposPath);
        debug(`Went looking in '${settings?.keepLocalReposPath}'.. Found ${asString(dirs)}`)
        setCodeHosts(dirs)
      } else {
        setCodeHosts([])
      }
    })()
  }, [settings, settings?.keepLocalReposPath])
  return codeHosts;
}

export function useOwnerFilter(
  settings: MegaSettingsType,
  codeHost: string,
): string[] {
  const [owners, setOwners] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      if (settings?.keepLocalReposPath && codeHost !== '*') {
        const p = await path.join(settings.keepLocalReposPath, codeHost)
        const dirs: string[] = await getDirNames(p);
        setOwners(dirs)
      } else {
        setOwners([])
      }
    })()
  }, [settings, settings?.keepLocalReposPath, codeHost])
  return owners;
}

export function useRepoFilter(
  settings: MegaSettingsType,
  codeHost: string,
  owner: string,
): string[] {
  const [repos, setRepos] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      if (settings?.keepLocalReposPath && codeHost && codeHost !== '*' && owner && owner !== '*') {
        const p = await path.join(settings.keepLocalReposPath, codeHost, owner)
        const dirs: string[] = await getDirNames(p);
        setRepos(dirs)
      } else {
        setRepos([])
      }
    })()
  }, [settings, settings?.keepLocalReposPath, codeHost, owner])
  return repos;
}

async function getDirNames(p: string): Promise<string[]> {
  const fileEntries = await fs.readDir(p);
  const dirs = fileEntries
    .filter((f) => f.children !== undefined && f.name !== undefined)
    .map((f) => f.name)
    .map((f) => f as string);
  await trace(`Read dir ${p}. It had this content: ${asString(fileEntries)}, these are the dirs: ${asString(dirs)}`)
  return dirs;
}
