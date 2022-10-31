import {LocalSearchHostSettings, MegaSettingsType} from "../../hooks/MegaContext";
import {SearchClient, SearchHit} from "./types";
import {ChildProcess, Command} from "@tauri-apps/api/shell";
import {keepPathToSearchHit, listKeeps} from "../../service/file/cloneDir";
import {debug, error, warn} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {sleep} from "../../service/delay";
import {resolve} from "@tauri-apps/api/path";

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
    for (const keep of keeps) {
      debug(`Evaluating ${keep}`)
      if (aggregate.size >= max) break
      try {
        debug('1')
        const command = new Command(this.settings.program, searchTokens, {cwd: keep});
        const result: boolean = await withTimeout(1000, command)
        debug('2')

        if (result) {
          debug('3')
          aggregate.add(await keepPathToSearchHit('local', keep))
          debug('4')
          debug('Found ' + keep)
        } else {
          error(`Failed executing search for ${this.settings.program} ${searchString} due to ${asString(result)}`)
          debug('NOT ' + keep)
        }
      } catch (e) {
        warn(`Exception trying to run local search program '${this.settings.program} ${asString(searchTokens)}' '${asString(e)}'`)
      }
    }
    return Array.from(aggregate.values())
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

async function withTimeout(timeLimit: number, command: Command): Promise<boolean> {
  let timeoutHandle: number | undefined = undefined
  const timeoutPromise = new Promise<ChildProcess>((_resolve, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error('Async call timeout limit reached')),
      timeLimit
    );
  });
  let code: number | null = null;
  await command.on("close", (data) => {
    code = data.code;
  })
  command.on('error', err => {
    error(`command error: "${err}"`)
    code = -1
  });
  command.stdout.on('data', line => debug(`command stdout: "${line}"`));
  command.stderr.on('data', line => debug(`command stderr: "${line}"`));
  const child = await command.spawn()
  const startTime = new Date().getTime()
  return new Promise<boolean>(async () => {
    const currentTime = new Date().getTime()
    while (code === null && (currentTime - startTime) < 1000) {
      sleep(1000)
    }
    if (code === 0) {
      return true;
    } else {
      await child.kill()
      return true
    }
  });
}
