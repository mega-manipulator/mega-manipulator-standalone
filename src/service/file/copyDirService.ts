import {fs} from "@tauri-apps/api";
import {debug, trace, error} from "tauri-plugin-log-api";

export async function copyDir(source: string, dest: string) {
  try{
    await fs.readDir(source, {recursive: false})
  }catch (e){
    const message = 'Source '+source+' does not exist';
    await error(message)
    throw new Error(message)
  }
  await fs.createDir(dest, {recursive:true})
  const destFiles = await fs.readDir(dest, {})
  if (destFiles.length > 0) {
    throw new Error('Copy destination is not empty')
  }
  const allSourceFiles = await fs.readDir(source, {recursive: true})
  debug(`Recursive copy of ${allSourceFiles.length} files from ${source} to ${dest}`)
  for (const f of allSourceFiles) {
    const allDestFiles = await fs.readDir(dest, {recursive: true})
    trace('Dest now contains: ' + JSON.stringify(allDestFiles))
    const newDestPath = f.path.replace(source, dest)
    trace(`Will now copy ${f.path} to ${newDestPath}`)

    if (f.children !== undefined) {
      trace('Create new dir: ' + newDestPath)
      try {
        await fs.createDir(newDestPath)
      } catch (e) {
      }
    } else {
      trace('Copy file to: ' + newDestPath)
      await fs.copyFile(f.path, newDestPath)
    }
  }
}
