import {useCallback, useContext, useState} from "react";
import {FormControl, FormHelperText, IconButton, Switch, Tooltip, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {runScriptInParallel, runScriptSequentially, scriptFile} from "../../service/file/scriptFile";
import {path} from "@tauri-apps/api";
import {open} from "@tauri-apps/api/shell";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import {
  GenericSpeedDialActionProps,
  useGenericSpeedDialActionProps
} from "../components/speeddial/GenericSpeedDialAction";
import {ProgressReporter} from "../../service/types";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export function useExecuteScriptedChangeMenuItem(): GenericSpeedDialActionProps {
  const {settings, clones: {selected}} = useContext(MegaContext);
  const [runMode, setRunMode] = useState<'sequential' | 'parallel'>('sequential');
  const action = useCallback(async (progress: ProgressReporter) => {
    switch (runMode) {
      case "parallel":
        return await runScriptInParallel({settings, filePaths: selected}, progress)
      case "sequential":
        return await runScriptSequentially({settings, filePaths: selected}, progress)
    }
    return {time: 0}
  }, [runMode, selected, settings])
  return useGenericSpeedDialActionProps(
    'Scripted change',
    selected.length === 0,
    <AutoFixHighIcon/>,
    <>
      <Typography variant={'h6'}>Run Scripted Change on {selected.length} projects?</Typography>
      <Typography>The script will execute in the root of every project folder, and can be run in sequence or in
        parallel.</Typography>
      <FormControl>
        <FormHelperText>{runMode}</FormHelperText>
        <Switch
          checked={runMode === 'parallel'}
          onClick={() => setRunMode(runMode === 'parallel' ? 'sequential' : "parallel")}
        />
      </FormControl>

      <Tooltip title={'Open change-script'}><IconButton
        onClick={() => path.join(settings.clonePath, scriptFile).then((file) => open(file))}
      ><FileOpenIcon/></IconButton></Tooltip>
    </>,
    action,
    undefined
  );
}
