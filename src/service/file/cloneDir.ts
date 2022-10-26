import {fs} from "@tauri-apps/api";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {asString} from "../../hooks/logWrapper";
import {error, trace, warn} from "tauri-plugin-log-api";

export async function listClones(settings: MegaSettingsType): Promise<string[]> {
  trace('listClones')
  if (!settings.clonePath) {
    warn('listClones bailed, no clonePath in settings')
    return [];
  }
  try {
    return await listClonesRecursive(0, settings.clonePath)
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

export interface RepoBadStatesReport {
  repoPath: string;
  uncommittedChanges: boolean;
  onDefaultBranch: boolean;
  noDiffWithOriginHead: boolean;
}

export async function analyzeRepoForBadStates(settings:MegaSettingsType, repoPath: string): Promise<RepoBadStatesReport> {
  const [uncommittedChanges, onDefaultBranch, noDiffWithOriginHead] = await Promise.all([hasUncommittedChanges(repoPath), hasOnDefaultBranch(repoPath), hasNoDiffWithOriginHead(repoPath)])
  const trimmedRepoPath = repoPath.substring((settings.clonePath?.length ?? -1) + 1)
  return {
    repoPath: trimmedRepoPath,
    uncommittedChanges,
    onDefaultBranch,
    noDiffWithOriginHead,
  }
}

async function hasUncommittedChanges(repoPath: string): Promise<boolean> {
  // todo: impl
  return true;
}

async function hasOnDefaultBranch(repoPath: string): Promise<boolean> {
  // todo: impl
  return true;
}

async function hasNoDiffWithOriginHead(repoPath: string): Promise<boolean> {
  // todo: impl
  return true;
}
