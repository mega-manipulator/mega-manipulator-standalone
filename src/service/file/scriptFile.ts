import {Command} from '@tauri-apps/api/shell';
import {MegaSettingsType} from "../../hooks/settings";
import {fs, os, path} from "@tauri-apps/api";
import {message} from '@tauri-apps/api/dialog';
import {debug} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";

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
  const clonePath = await fs.readDir(settings.clonePath)
  if (!clonePath.some((f) => !f.children && f.name === scriptFile)) {
    await fs.writeTextFile(await path.join(settings.clonePath, scriptFile), scriptFileContent)
  }
  switch (await os.type()) {
    case "Linux":
      await message(`Not implemented on Linux yet, you'll need to open these manually, switch to mac, or make a PR on this project ;-)`)
      break;
    case "Darwin":
      for (const filePath of filePaths) {
        const command = new Command('open-osx', ['-a', settings.editorApplication, filePath]);
        command.on("close", () => {
          debug('Open command terminated')
        })
        command.on("error", (...args: any[]) => debug('Open command errored: ' + asString(args)))
        await command.spawn()
      }
      break;
    case "Windows_NT":
      await message(`Not implemented on Windows yet, you'll need to open these manually, switch to mac, or make a PR on this project ;-)`)
      break;
  }
}
