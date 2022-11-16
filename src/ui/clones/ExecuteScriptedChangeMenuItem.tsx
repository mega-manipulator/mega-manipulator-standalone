import React, {useCallback, useContext, useState} from "react";
import {GenericMultiProjectMenuItem} from "./GenericMultiProjectMenuItem";
import {FormControlLabel, Switch, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {runScriptInParallel, runScriptSequentially} from "../../service/file/scriptFile";
import {WorkResultStatus} from "../../service/types";

export const ExecuteScriptedChangeMenuItem: React.FC = () => {
  const {settings, clones: {selected}} = useContext(MegaContext);
  const [runMode, setRunMode] = useState<'sequential' | 'parallel'>('sequential');
  const [result, setResult] = useState<{ [wrs: string]: number }>({})
  const progressCallback: (path: string, status: WorkResultStatus) => void = useCallback((path: string, status: WorkResultStatus) => {
    result[status] = (result[status] ?? 0) + 1
    setResult(result)
  }, [result, setResult]);

  return <GenericMultiProjectMenuItem
    openButtonText={`Run Scripted Change`}
    confirm={<>
      <Typography>Run Scripted Change on {selected.length} projects</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={runMode === 'parallel'}
            onClick={() => setRunMode(runMode === 'parallel' ? 'sequential' : "parallel")}
          />
        }
        label={runMode}
      />
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
    isAvailable={async () => true}
  />
}
