import {fs} from "@tauri-apps/api";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {asString} from "../../hooks/logWrapper";
import {trace, warn,error} from "tauri-plugin-log-api";

export async function listClones(settings: MegaSettingsType): Promise<string[]> {
  trace('listClones')
  if (!settings.clonePath) {
    warn('listClones bailed, no clonePath in settings')
    return [];
  }
  try {
    return  await listClonesRecursive(0, settings.clonePath)
  } catch (e) {
    error('listClones encountered an exception: ' + asString(e))
    return []
  }
}

async function listClonesRecursive(depth: number, path: string): Promise<string[]> {
  const dir = await fs.readDir(path)
  if (depth === 4) {
    if (dir.some(f => f.name === '.git')) {
      trace(`Here I am at path ${path}`)
      return [path]
    } else {
      trace(`Here I am at path ${path} WITHOUT a .GIT`)
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
