import {useCallback, useContext} from "react";
import {Alert, Typography} from "@mui/material";
import {fs} from "@tauri-apps/api";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";
import {MegaContext} from "../../../hooks/MegaContext";
import {
  GenericSpeedDialActionProps,
  useGenericSpeedDialActionProps
} from "../../components/speeddial/GenericSpeedDialAction";
import DeleteIcon from '@mui/icons-material/Delete';
import {ProgressReporter} from "../../../service/types";

export function useDeleteMenuItem(
  reloadCallback: () => void
): GenericSpeedDialActionProps {
  const {settings, clones: {selected}} = useContext(MegaContext)
  const action = useCallback(async (progress: ProgressReporter) => {
    const errAggregate: string[] = []
    if (!settings) throw new Error('Settings undefined')
    progress(0, selected.length)
    for (let i = 0; i < selected.length; i++) {
      const repo = selected[i]
      try {
        await fs.removeDir(repo, {recursive: true});
      } catch (e) {
        const message = `Failed removing '${repo}' due to '${asString(e)}'`;
        error(message)
        errAggregate.push(message)
      } finally {
        progress(i + 1, selected.length)
      }
    }
    progress(selected.length, selected.length)
    reloadCallback()
    if (errAggregate.length !== 0) {
      const msg = `${errAggregate.length} repos failed deleting`
      error(`${msg} ${asString(errAggregate)}`)
      throw new Error(`${msg}, more info in logs`)
    } else {
      return {time: 0}
    }
  }, [reloadCallback, selected, settings]);


  return useGenericSpeedDialActionProps(
    'Delete clones',
    selected.length === 0,
    <DeleteIcon/>,
    selected.length === 0 ? <Alert color={'warning'} variant={'outlined'}>No Clones selected</Alert> :
      <>
        <Typography variant={'h6'}>Delete {selected.length} repos from workdir?</Typography>
        <Typography>They will still be available in the keep dir to clone/copy again ⚡️</Typography>
      </>,
    action,
  );
}
