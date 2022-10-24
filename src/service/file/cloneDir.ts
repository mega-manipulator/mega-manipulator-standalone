import {fs} from "@tauri-apps/api";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {asString, logDebug, logError, logWarn} from "../../hooks/logWrapper";

export async function listClones(settings: MegaSettingsType): Promise<string[]> {
  logDebug('listClones')
  if (!settings.clonePath) {
    logWarn('listClones bailed, no clonePath in settings')
    return [];
  }
  try {

    const unfilteredFiles = await fs.readDir(settings.clonePath)
    const filtered: (string | undefined)[] = unfilteredFiles.flatMap(f => f.children?.flatMap(f => f.children?.flatMap(f => f.children?.flatMap(f => f.children?.flatMap(f => f.children?.filter(f => f.name === '.git').map(f => f.path))))))
    logDebug('Filtered dirs ' + asString(filtered))
    const filteredAndExists: string[] = filtered.filter(it => typeof it === "string").map(it => it as string)
    logDebug('FilteredAndExists dirs ' + asString(filteredAndExists))
    return filteredAndExists
  } catch (e) {
    logError('listClones encountered an exception: ' + asString(e))
    return []
  }
}

/*
async function listClonesRecursive(depth: number, path: string): Promise<string[]> {
  const unfilteredFiles = await fs.readDir(path)
  if(depth === 4){
    if (unfilteredFiles.some(f => f.name === '.git')) {
      return [path]
    } else {
      return []
    }
  }else{
    let map: (FileEntry[] | undefined)[] = unfilteredFiles.filter(f => f.children).map(f => f.children?.map(f => f.));

  }
  return []
}
*/
