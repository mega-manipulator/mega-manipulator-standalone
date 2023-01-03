import {MegaSettingsType} from "../../../hooks/settings";
import {SearchHit} from "../types";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {listRepos, pathToSearchHit} from "../../../service/file/cloneDir";
import {debug, error} from "tauri-plugin-log-api";
import React, {useEffect, useState} from "react";
import {path} from "@tauri-apps/api";
import {ProgressReporter} from "../../../service/types";

export interface LocalSearchClientWrapper {
  client: LocalSearchClient | undefined;
  error: string | undefined;
}

export const useLocalSearchClient: (
  settings: MegaSettingsType,
) => LocalSearchClientWrapper = (
  settings: MegaSettingsType,
) => {
  const [wrapper, setWrapper] = useState<LocalSearchClientWrapper>({client: undefined, error: 'Not yet initialized'})
  useEffect(() => {
    if (settings) {
      setWrapper({client: new LocalSearchClient(settings), error: undefined})
      setWrapper({client: new LocalSearchClient(settings), error: undefined})
    } else {
      setWrapper({client: undefined, error: 'No settings'})
    }
  }, [settings])
  return wrapper;
}

export class LocalSearchClient {

  private readonly megaSettings: MegaSettingsType;

  constructor(megaSettings: MegaSettingsType) {
    this.megaSettings = megaSettings;
  }

  async searchCode(
    program: string,
    searchString: string,
    fileString: string | undefined,
    max: number,
    codeHost: string,
    owner: string,
    repo: string,
    searchRef:React.MutableRefObject<number>,
    progress:ProgressReporter,
  ): Promise<SearchHit[]> {
    const fixedSearchRef = searchRef.current;
    if (this.megaSettings.keepLocalReposPath === undefined) return [];
    let pathParts: string[] = [this.megaSettings.keepLocalReposPath, codeHost, owner, repo]
    const firstAsterisk = pathParts.indexOf('*')
    if (firstAsterisk > 0) {
      pathParts = pathParts.slice(0, firstAsterisk)
    }
    const depth = codeHost === '*' ? 3 : owner === '*' ? 2 : repo === '*' ? 1 : 0
    const allowedPrefix = await path.join(...pathParts)
    debug('Allowed prefix: ' + allowedPrefix)
    const keeps: string[] = (await listRepos(allowedPrefix, depth))

    debug(`Search for '${searchString}' with the local client in ${keeps.length} dirs, using '${program}'`)
    const aggregate:SearchHit[] = [];
    const chunkSize = 10;
    chunk: for (let i = 0; i < keeps.length; i += chunkSize) {
      progress(i, keeps.length)
      if(searchRef.current != fixedSearchRef) break chunk;
      const thisChunk = keeps.slice(i, Math.min(i+chunkSize, keeps.length))
      const commands: (SearchHit | null)[] = await Promise.all(thisChunk.map((keep) => {
        return withTimeout(1000, searchCommand(program, searchString, fileString, keep))
          .then(async (c) => {
            if (c.code === 0) {
              return await pathToSearchHit('local', keep);
            } else {
              return null
            }
          });
      }))
      for (let j = 0; j < commands.length; j++) {
        if(commands[j] !== null){
          aggregate.push(commands[j] as SearchHit)
        }
        if(aggregate.length == max) break chunk;
      }
    }
    return aggregate;
  }
}

function searchCommand(program: string, search: string, file: string | undefined, dir: string): Command {
  switch (program) {
    case 'ag':
      return new Command('ag', ['-m', '-L', search, file ?? '.'], {cwd: dir});
    default:
      throw new Error(`program ${program} is unknown`)
  }
}

async function withTimeout(timeLimit: number, command: Command): Promise<ChildProcess> {
  let timeoutHandle: number | undefined = undefined
  const timeoutPromise = new Promise<ChildProcess>((_resolve) => {
    timeoutHandle = setTimeout(
      () => _resolve({stdout: 'timeout', code: -1, stderr: 'timeout', signal: null}),
      timeLimit
    );
  });
  command.on('error', err => error(`command error: "${err}"`));
  return Promise.race([command.execute(), timeoutPromise]).then(result => {
    timeoutHandle && clearTimeout(timeoutHandle);
    return result;
  });
}
