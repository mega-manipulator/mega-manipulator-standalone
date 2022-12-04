import React, {useCallback, useContext, useEffect, useState} from "react";
import {Alert, Button, CircularProgress, TextField, Tooltip} from "@mui/material";
import {gitCommit} from "../../service/file/gitCommit";
import {asString} from "../../hooks/logWrapper";
import {MegaContext} from "../../hooks/MegaContext";
import {WorkResultStatus} from "../../service/types";
import {getResultFromStorage} from "../../service/work/workLog";
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";

export const CommitView: React.FC = () => {
  const nav = useNavigate()
  const {clones: {selected}, settings} = useContext(MegaContext);
  const [err, setErr] = useState<string>();
  const [used, setUsed] = useState(false);
  const [resultNumber, setResultNumber] = useState<number>();
  const [result, setResult] = useState<WorkResultStatus>();
  useEffect(() => {
    (async () => {
      if (!resultNumber) {
        setResult(undefined)
      } else {
        const result = await getResultFromStorage(`${resultNumber}`)
        setResult(result?.status)
      }
    })()
  }, [resultNumber]);

  const [commitMessage, setCommitMessage] = useState('');
  const trigger = useCallback(() => {
    setUsed(true)
    gitCommit({
      hits: selected,
      settings,
      commitMessage,
      sourceString: `Commit to ${selected.length} repos`,
      workResultKind: 'gitCommit',
    })
      .then((result) => setResultNumber(result))
      .catch((e) => setErr(asString(e)))
  }, [commitMessage]);

  return <>
    {err && <Alert>{err}</Alert>}
    {used && !resultNumber && <Alert variant={"filled"} color={"info"}>In progress</Alert>}
    {resultNumber && !result && <Alert variant={"filled"} color={"warning"}>Unknown result</Alert>}
    {resultNumber && result &&
        <Tooltip title={'Click to open result page'}>
            <Alert
                onClick={() => nav(`${locations.result.link}/${resultNumber}`)}
                variant={"filled"}
                color={result === "ok" ? "success" : "warning"}
            >Result: {result}</Alert>
        </Tooltip>}
    <div>
      <TextField
        minRows={5}
        fullWidth
        label={'Commit message'}
        disabled={used}
        value={commitMessage}
        onChange={(event) => setCommitMessage(event.target.value)}
      />
    </div>
    {used && !resultNumber && <CircularProgress/>}
    <Button
      size={"large"}
      color={"primary"}
      variant={"contained"}
      style={{marginTop: '5px'}} disabled={used}
      onClick={trigger}>
      Commit
    </Button>
  </>
};
