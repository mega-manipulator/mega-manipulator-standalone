import {MegaSettingsType} from "../../hooks/MegaContext";
import {SearchHit} from "./types";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {listRepos, pathToSearchHit} from "../../service/file/cloneDir";
import {debug, error} from "tauri-plugin-log-api";
import {useEffect, useState} from "react";

export interface LocalSearchClientWrapper {
  client: LocalSearchClient | undefined;
  error: string | undefined;
}

export const useLocalSearchClient: (settings: MegaSettingsType | null | undefined) => LocalSearchClientWrapper = (
  settings: MegaSettingsType | null | undefined
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

  async searchCode(program: string, searchString: string, fileString: string, max: number): Promise<SearchHit[]> {
    const keeps: string[] = await listRepos(this.megaSettings.keepLocalReposPath)
    debug(`Search for '${searchString}' with the local client in ${keeps.length} dirs, using '${program}'`)
    const commands: (SearchHit | null)[] = await Promise.all(keeps.map((keep, i) => {
      return withTimeout(1000, searchCommand(program, searchString, fileString, keep))
        .then(async (c) => {
          if (c.code === 0) {
            return await pathToSearchHit('local', keep);
          } else {
            return null
          }
        });
    }))
    return (commands.filter((b) => b !== null) as SearchHit[]).slice(0, max)
  }
}

function searchCommand(program:string, search:string, file:string, dir:string):Command {
  switch (program){
    case 'ag':
      return new Command('ag', ['-m', '-L', search, file], {cwd: dir});
    default:
      throw new Error(`program ${program} is unknown`)
  }
}

function tokenizeString(searchString: string): string[] {
  const aggregate: string[] = []
  const words = searchString.split(/ /g)
  let buffer: string[] = []
  let bufferChar = 'c'
  for (const word of words) {
    if (buffer.length > 0) {
      if (word.endsWith(bufferChar)) {
        buffer.push(word.substring(0, word.length - 1))
        aggregate.push(buffer.join(' '))
        buffer = []
      } else {
        buffer.push(word)
      }
    } else {
      if ((word.startsWith("'") && !word.endsWith("'"))) {
        bufferChar = "'"
        buffer.push(word.substring(1))
      } else if ((word.startsWith('"') && !word.endsWith('"'))) {
        bufferChar = '"'
        buffer.push(word.substring(1))
      } else {
        aggregate.push(word)
      }
    }
  }
  return aggregate
}

async function withTimeout(timeLimit: number, command: Command): Promise<ChildProcess> {
  let timeoutHandle: number | undefined = undefined
  const timeoutPromise = new Promise<ChildProcess>((_resolve, _reject) => {
    timeoutHandle = setTimeout(
      () => _resolve({stdout: 'timeout', code: -1, stderr: 'timeout', signal: null}),
      timeLimit
    );
  });
  command.on('error', err => error(`command error: "${err}"`));
  // command.stdout.on('data', line => info(`command stdout: "${line}"`));
  // command.stderr.on('data', line => info(`command stderr: "${line}"`));
  return Promise.race([command.execute(), timeoutPromise]).then(result => {
    timeoutHandle && clearTimeout(timeoutHandle);
    return result;
  });
}
