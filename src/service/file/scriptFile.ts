import {Command, open} from '@tauri-apps/api/shell';
import {MegaSettingsType} from "../../hooks/settings";
import {fs, os, path} from "@tauri-apps/api";
import {error, info, warn} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {FileEntry} from "@tauri-apps/api/fs";
import {WorkResult, WorkResultStatus} from "../types";
import {saveResultToStorage} from "../work/workLog";

export const scriptFile = 'mega-manipulator.bash'
const scriptFileContent = `#!/bin/bash

# Really strict =)
set -Eeuo pipefail

# Debug
# set -x

# Error context - borrowed from https://unix.stackexchange.com/a/522815/86300
trap 'echo >&2 "Error - exited with status $? at line $LINENO:";
         pr -tn $0 | tail -n+$((LINENO - 3)) | head -n7' ERR

# You might need to set Homebrew (et al) PATHs manually depending on your IntelliJ installation/startup.
# I've found that Java ProcessBuilder started from the plugin, started from IntelliJ, started from your terminal,
# gets your regular PATH setup. Most other startup methods dont.
# export "PATH=/usr/local/bin:$PATH"

temp_dir="$(mktemp -d)"
export temp_dir
trap 'rm -rf "$temp_dir"' EXIT

echo 'Hello world'
echo 'Wanna execute your own script? Delegate that from here!' | grep -q 'foooooo' # Intentional failure
`

export async function openDirs(settings: MegaSettingsType, filePaths: string[]) {
  switch (await os.type()) {
    case "Linux":
      info(`"open" not implemented on Linux yet, you'll need to open these manually, switch to mac, or make a PR on this project ;-)`)
      filePaths.forEach((p) => open(p))
      break;
    case "Darwin":
      for (const filePath of filePaths) {
        const command = new Command('open-osx', ['-a', settings.editorApplication, filePath]);
        command.on("close", () => {
          info(`Open "${filePath}" with "${settings.editorApplication}" command terminated `)
        })
        command.on("error", (...args: unknown[]) => warn('Open command errored: ' + asString(args)))
        await command.spawn()
      }
      break;
    case "Windows_NT":
      info(`"open" not implemented on Windows yet, you'll need to open these manually, switch to mac, or make a PR on this project ;-)`)
      filePaths.forEach((p) => open(p))
      break;
  }
}

type RunScriptInput = {
  settings: MegaSettingsType,
  filePaths: string[],
}

export async function runScriptSequentially(input: RunScriptInput, progressCallback?: (path: string, result: WorkResultStatus) => void): Promise<WorkResultStatus> {
  const scriptPath: string = await createScriptFileIfNotExists(input.settings)
  const workResult = newWorkResult(input);
  for (let index = 0; index < input.filePaths.length; index++) {
    await doWork(input, workResult, scriptPath, index, progressCallback)
  }
  await saveResultToStorage(workResult)
  return workResult.result.some((w) => w.output.status !== "ok") ? "failed" : "ok"
}

async function doWork(input: RunScriptInput, workResult: WorkResult<RunScriptInput, string, unknown>, scriptPath: string, index: number, progressCallback?: (path: string, result: WorkResultStatus) => void) {
  const filePath = input.filePaths[index];
  try {
    const commandResult = await new Command('bash-run-script', [scriptPath], {cwd: filePath}).execute()
    if (commandResult.code !== 0) await warn(`Failed running scripted change in '${filePath}', result was: ${asString(commandResult)}`)
    const status: WorkResultStatus = commandResult.code === 0 ? 'ok' : 'failed';
    progressCallback && progressCallback(filePath, status)
    workResult.result[index].output.status = status
    workResult.result[index].output.meta = commandResult
  } catch (e) {
    progressCallback && progressCallback(filePath, 'failed')
    workResult.result[index].output.status = 'failed'
    const message1 = `Failed running scripted change in '${filePath}', error was: ${asString(e)}`;
    await error(message1)
    workResult.result[index].output.meta = message1
  }
}

function newWorkResult(input: RunScriptInput): WorkResult<RunScriptInput, string, unknown> {
  const time = new Date().getTime()
  return {
    name: `Run scripted change of ${input.filePaths.length}`,
    kind: "scriptedChange",
    time,
    status: "in-progress",
    input,
    result: input.filePaths.map(h => ({
      input: h,
      output: {
        status: "in-progress"
      }
    })),
  };
}

export async function runScriptInParallel(input: RunScriptInput, progressCallback?: (path: string, result: WorkResultStatus) => void): Promise<WorkResultStatus> {
  const scriptPath = await createScriptFileIfNotExists(input.settings)
  const workResult = newWorkResult(input);
  await Promise.all(workResult.result.map((_, index) => doWork(input, workResult, scriptPath, index, progressCallback)))
  await saveResultToStorage(workResult)
  return workResult.result.some((w) => w.output.status !== "ok") ? "failed" : "ok"
}

export async function getScriptInfo(settings: MegaSettingsType): Promise<{ scriptPath: string, scriptContent: string }> {
  const scriptPath = await createScriptFileIfNotExists(settings)
  const scriptContent = await fs.readTextFile(scriptPath)
  return {
    scriptContent,
    scriptPath,
  }
}

/**
 * Returns the script file path
 */
async function createScriptFileIfNotExists(settings: MegaSettingsType): Promise<string> {
  const scriptPath = await path.join(settings.clonePath, scriptFile)
  const cloneDirFiles: FileEntry[] = await fs.readDir(settings.clonePath)
  if (!cloneDirFiles.some((f) => !f.children && f.name === scriptFile)) {
    await fs.writeTextFile(scriptPath, scriptFileContent)
    const chmodResult = await new Command('chmod-script-file', ['+x', scriptPath]).execute()
    if (chmodResult.code !== 0) {
      throw new Error(`Failed chmodding script file due to: ${asString(chmodResult)}`)
    }
  }
  return scriptPath
}
