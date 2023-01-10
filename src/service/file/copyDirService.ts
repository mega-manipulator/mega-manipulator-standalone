import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';

export async function copyDir(source: string, dest: string) {
  const home = await homeDir();
  if (!source.startsWith(home))
    throw new Error('Source of copy must be in home dir');
  if (!dest.startsWith(home))
    throw new Error('Destination of copy must be in home dir');
  await invoke('copy_dir', { source, dest });
}
