import React, {useCallback, useContext, useState} from "react";
import {GenericMultiProjectMenuItem} from "./GenericMultiProjectMenuItem";
import {Alert, Button, FormControl, FormHelperText, Switch, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {openDirs, runScriptInParallel, runScriptSequentially} from "../../service/file/scriptFile";
import {WorkResultStatus} from "../../service/types";
import {path} from "@tauri-apps/api";

export const ExecuteScriptedChangeMenuItem: React.FC = () => {
  const {settings, clones: {selected}} = useContext(MegaContext);
  const [runMode, setRunMode] = useState<'sequential' | 'parallel'>('sequential');
  const [result, setResult] = useState<{ [wrs: string]: number }>({})
  const progressCallback: (_path: string, _status: WorkResultStatus) => void = useCallback((_path: string, status: WorkResultStatus) => {
    result[status] = (result[status] ?? 0) + 1
    setResult(result)
  }, [result]);

  return <GenericMultiProjectMenuItem
    openButtonText={`Run Scripted Change`}
    confirm={<>
      {Object.keys(result).length === 0 ?
        <Typography>Run Scripted Change on {selected.length} projects</Typography> :
        <>{Object.keys(result).map((k, i) => <Alert
          key={i}
          variant={"outlined"}
          color={k === 'ok' ? "success" : "warning"}
        >{k} {result[k]}</Alert>)}</>
      }
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
    action={async () => {
      switch (runMode) {
        case "parallel":
          await runScriptInParallel({settings, filePaths: selected}, progressCallback)
          break;
        case "sequential":
          await runScriptSequentially({settings, filePaths: selected}, progressCallback)
          break;
      }
    }}
    closeAction={() => {
      setResult({})
    }}
    isAvailable={async () => selected.length !== 0}
  />
}
