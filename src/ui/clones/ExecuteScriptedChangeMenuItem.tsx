import React, {useContext, useState} from "react";
import {GenericMultiProjectMenuItem} from "./GenericMultiProjectMenuItem";
import {Button, FormControl, FormHelperText, Switch, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {openDirs, runScriptInParallel, runScriptSequentially} from "../../service/file/scriptFile";
import {path} from "@tauri-apps/api";

export const ExecuteScriptedChangeMenuItem: React.FC = () => {
  const {settings, clones: {selected}} = useContext(MegaContext);
  const [runMode, setRunMode] = useState<'sequential' | 'parallel'>('sequential');

  return <GenericMultiProjectMenuItem
    openButtonText={`Run Scripted Change`}
    confirm={<>
      <Typography variant={'h6'}>Run Scripted Change on {selected.length} projects</Typography>
      <Button
        variant={"outlined"}
        color={"primary"}
        onClick={() => path.join(settings.clonePath, 'mega-manipulator.bash')
          .then((p) => openDirs(settings, [p]))}
      >Open script in editor</Button>
      <FormControl>
        <FormHelperText>{runMode}</FormHelperText>
        <Switch
          checked={runMode === 'parallel'}
          onClick={() => setRunMode(runMode === 'parallel' ? 'sequential' : "parallel")}
        />
      </FormControl>
    </>}
    action={async (progress) => {
      switch (runMode) {
        case "parallel":
          await runScriptInParallel({settings, filePaths: selected}, progress)
          break;
        case "sequential":
          await runScriptSequentially({settings, filePaths: selected}, progress)
          break;
      }
    }}
    closeAction={() => {
      return;
    }}
    isAvailable={async () => selected.length !== 0}
  />
}
