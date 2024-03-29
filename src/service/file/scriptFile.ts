import { Command, open } from '@tauri-apps/api/shell';
import { MegaSettingsType } from '../../hooks/settings';
import { fs, path } from '@tauri-apps/api';
import { error, info, warn } from 'tauri-plugin-log-api';
import { asString } from '../../hooks/logWrapper';
import { FileEntry } from '@tauri-apps/api/fs';
import { WorkResult, WorkResultStatus } from '../types';
import { saveResultToStorage } from '../work/workLog';
import { SimpleActionReturn } from './simpleActionWithResult';
import { OsType } from '@tauri-apps/api/os';

export const scriptFile = 'mega-manipulator.bash';
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
`;

export async function openDirs(osType: OsType, settings: MegaSettingsType, filePaths: string[]) {
  if (osType === 'Darwin' && settings.useSpecificEditorApplication) {
    for (const filePath of filePaths) {
      const command = new Command('open-osx', ['-a', settings.editorApplication, filePath]);
      command.on('close', () => {
        info(`Open "${filePath}" with "${settings.editorApplication}" command terminated `);
      });
      command.on('error', (...args: unknown[]) => warn('Open command errored: ' + asString(args)));
      await command.spawn();
    }
  } else {
    info(`OS does not support fancy open ${osType}, or you've not enabled it 🤦${settings.useSpecificEditorApplication}`);
    filePaths.forEach((p) => open(p));
  }
}

type RunScriptInput = {
  settings: MegaSettingsType;
  filePaths: string[];
};

export async function runScriptSequentially(input: RunScriptInput, progressCallback: (idx: number, total: number) => void): Promise<SimpleActionReturn> {
  const scriptPath: string = await createScriptFileIfNotExists(input.settings);
  const workResult = newWorkResult(input);
  for (let index = 0; index < input.filePaths.length; index++) {
    await doWork(input, workResult, scriptPath, index, () => progressCallback(index, input.filePaths.length));
  }
  await saveResultToStorage(workResult);
  return workResult;
}

async function doWork(input: RunScriptInput, workResult: WorkResult<RunScriptInput, string, unknown>, scriptPath: string, index: number, progressCallback: () => void) {
  const filePath = input.filePaths[index];
  try {
    const commandResult = await new Command('bash-run-script', [scriptPath], {
      cwd: filePath,
    }).execute();
    if (commandResult.code !== 0) await warn(`Failed running scripted change in '${filePath}', result was: ${asString(commandResult)}`);
    const status: WorkResultStatus = commandResult.code === 0 ? 'ok' : 'failed';
    progressCallback();
    workResult.result[index].output.status = status;
    workResult.result[index].output.meta = commandResult;
  } catch (e) {
    progressCallback();
    workResult.result[index].output.status = 'failed';
    const message1 = `Failed running scripted change in '${filePath}', error was: ${asString(e)}`;
    await error(message1);
    workResult.result[index].output.meta = message1;
  }
}

function newWorkResult(input: RunScriptInput): WorkResult<RunScriptInput, string, unknown> {
  const time = new Date().getTime();
  return {
    name: `Run scripted change of ${input.filePaths.length}`,
    kind: 'scriptedChange',
    time,
    status: 'in-progress',
    input,
    result: input.filePaths.map((h) => ({
      input: h,
      output: {
        status: 'in-progress',
      },
    })),
  };
}

export async function runScriptInParallel(input: RunScriptInput, progressCallback: (idx: number, total: number) => void): Promise<SimpleActionReturn> {
  const scriptPath = await createScriptFileIfNotExists(input.settings);
  const workResult = newWorkResult(input);
  await Promise.all(workResult.result.map((_, index) => doWork(input, workResult, scriptPath, index, () => progressCallback(index, input.filePaths.length))));
  await saveResultToStorage(workResult);
  return workResult;
}

export async function getScriptInfo(settings: MegaSettingsType): Promise<{ scriptPath: string; scriptContent: string }> {
  const scriptPath = await createScriptFileIfNotExists(settings);
  const scriptContent = await fs.readTextFile(scriptPath);
  return {
    scriptContent,
    scriptPath,
  };
}

/**
 * Returns the script file path
 */
async function createScriptFileIfNotExists(settings: MegaSettingsType): Promise<string> {
  const scriptPath = await path.join(settings.clonePath, scriptFile);
  const cloneDirFiles: FileEntry[] = await fs.readDir(settings.clonePath);
  if (!cloneDirFiles.some((f) => !f.children && f.name === scriptFile)) {
    await fs.writeTextFile(scriptPath, scriptFileContent);
    const chmodResult = await new Command('chmod-script-file', ['+x', scriptPath]).execute();
    if (chmodResult.code !== 0) {
      throw new Error(`Failed chmodding script file due to: ${asString(chmodResult)}`);
    }
  }
  return scriptPath;
}
