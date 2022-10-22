import {fs} from "@tauri-apps/api";
import {logDebug, logTrace} from "../../hooks/logWrapper";

export async function copyDir(source: string, dest: string) {
  await fs.readDir(dest, {recursive: true})
  const destFiles = await fs.readDir(dest, {})
  if (destFiles.length > 0) {
    throw 'Copy destination is not empty'
  }
  const allSourceFiles = await fs.readDir(source, {recursive: true})
  logDebug(`Recursive copy of ${allSourceFiles.length} files from ${source} to ${dest}`)
  for (const f of allSourceFiles) {
    const allDestFiles = await fs.readDir(dest, {recursive: true})
    logTrace('Dest now contains: ' + JSON.stringify(allDestFiles))
    const newDestPath = f.path.replace(source, dest)
    logTrace(`Will now copy ${f.path} to ${newDestPath}`)

    if (f.children !== undefined) {
      logTrace('Create new dir: ' + newDestPath)
      try {
        await fs.createDir(newDestPath)
      } catch (e) {
      }
    } else {
      logTrace('Copy file to: ' + newDestPath)
      await fs.copyFile(f.path, newDestPath)
    }
  }
}
