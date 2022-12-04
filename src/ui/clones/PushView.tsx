import React, {useCallback, useContext, useEffect, useState} from "react";
import {Alert, Button, Tooltip, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {gitPush} from "../../service/file/gitCommit";
import {asString} from "../../hooks/logWrapper";
import {WorkResultStatus} from "../../service/types";
import {getResultFromStorage} from "../../service/work/workLog";
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";

export const PushView: React.FC = () => {
  const {settings, clones: {selected}} = useContext(MegaContext);
  const nav = useNavigate()
  const [used, setUsed] = useState(false);
  const [err, setErr] = useState<string>();
  const [resultStatus, setResultStatus] = useState<WorkResultStatus>();
  const [workRef, setWorkRef] = useState<number>();
  useEffect(() => {
    if (!workRef) {
      setResultStatus(undefined)
    } else {
      getResultFromStorage(`${workRef}`).then((res) => {
        setResultStatus(res?.status)
      })
    }
  }, [workRef]);


  const trigger = useCallback(
    () => {
      window.alert('Not yet implemented! 😱')
      if (!used) {
        setUsed(true)
        gitPush({
          hits: selected,
          sourceString: `git push ${selected.length} repos`,
          settings,
          workResultKind: 'gitPush',
        })
          .then((ref) => setWorkRef(ref))
          .catch((e) => setErr(asString(e)))
      }
    },
    [selected],
  );

  // Render
  if (selected.length === 0) {
    return <Typography>No clones selected!</Typography>
  } else if (err) {
    return <Alert variant={"filled"} color={"error"}>{err}</Alert>
  } else if (workRef) {
    return <Tooltip title={'Click to open result view'}>
      <Alert
        onClick={()=> nav(`${locations.result.link}/${workRef}`)}
        variant={"filled"}
        color={resultStatus === "ok" ? "success" : "warning"}
      >{resultStatus === "in-progress" ? 'In progress' : resultStatus === "ok" ? 'Ok' : resultStatus === "failed" ? 'Failed' : 'Unknown'}</Alert>
    </Tooltip>
  } else {
    return <>
      <Typography>Push commits to origin</Typography>
      <Button
        variant={"contained"}
        color={"warning"}
        onClick={trigger}
      >Push 🚀</Button>
    </>
  }
};
