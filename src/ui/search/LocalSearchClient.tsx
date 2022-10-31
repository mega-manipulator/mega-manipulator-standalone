import {LocalSearchHostSettings, MegaSettingsType} from "../../hooks/MegaContext";
import {SearchClient, SearchHit} from "./types";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {keepPathToSearchHit, listKeeps} from "../../service/file/cloneDir";
import {debug, error, info} from "tauri-plugin-log-api";

export class LocalSearchClient implements SearchClient {

  private readonly megaSettings: MegaSettingsType;
  private readonly settings: LocalSearchHostSettings;

  constructor(megaSettings: MegaSettingsType, settings: LocalSearchHostSettings) {
    this.megaSettings = megaSettings;
    this.settings = settings;
  }

  async searchCode(searchString: string, max: number): Promise<SearchHit[]> {
    const keeps: string[] = await listKeeps(this.megaSettings)
    debug(`Search for '${searchString}' with the local client in ${keeps.length} dirs, using '${this.settings.program}'`)
    const aggregate: Set<SearchHit> = new Set()
    const searchTokens: string[] = tokenizeString(searchString)
    if (searchTokens.length < 2) throw new Error('Need at least 2 args to run this program')
    const commands: (SearchHit | null)[] = await Promise.all(keeps.map((keep, i) => withTimeout(1000, new Command(this.settings.program, searchTokens, {cwd: keep})).then(async (c) => {
      if (c.code === 0)
        return await keepPathToSearchHit('local', keep);
      else
        return null
    })))
    return commands.filter((b) => b !== null) as SearchHit[]
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
