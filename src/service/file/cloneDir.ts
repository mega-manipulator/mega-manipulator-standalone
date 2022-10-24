import {fs} from "@tauri-apps/api";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {asString, logDebug, logError, logTrace, logWarn} from "../../hooks/logWrapper";

export async function listClones(settings: MegaSettingsType): Promise<string[]> {
  logTrace('listClones')
  if (!settings.clonePath) {
    logWarn('listClones bailed, no clonePath in settings')
    return [];
  }
  try {
    return  await listClonesRecursive(0, settings.clonePath)
  } catch (e) {
    logError('listClones encountered an exception: ' + asString(e))
    return []
  }
}

async function listClonesRecursive(depth: number, path: string): Promise<string[]> {
  const dir = await fs.readDir(path)
  if (depth === 4) {
    if (dir.some(f => f.name === '.git')) {
      logTrace(`Here I am at path ${path}`)
      return [path]
    } else {
      logTrace(`Here I am at path ${path} WITHOUT a .GIT`)
      return []
    }
  } else {
    const aggregate: string[] = []
    for (const fileEntry of dir) {
      if (fileEntry.children) {
        const atLevel = await listClonesRecursive(depth + 1, fileEntry.path)
        aggregate.push(...atLevel)
      }
    }
    return aggregate
  }
}
