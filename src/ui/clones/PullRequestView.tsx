import React, {useCallback, useContext, useEffect, useState} from "react";
import {Alert, Box, Button, LinearProgress, TextField, Tooltip} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {pathToSearchHit} from "../../service/file/cloneDir";
import {SearchHit} from "../search/types";
import {asString} from "../../hooks/logWrapper";
import {useGitHubCodeClient} from "../search/github/useGitHubSearchClient";
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";
import {debug, error} from "tauri-plugin-log-api";

export const PullRequestView: React.FC = () => {
  const [title, setTitle] = useState<string>();
  const [body, setBody] = useState<string>();

  const nav = useNavigate()
  const {clones: {selected}, code: {codeHostKey, setCodeHostKey}} = useContext(MegaContext);
  const [hits, setHits] = useState<SearchHit[]>();
  const [err, setErr] = useState<string>();
  const [progress, setProgress] = useState<number>();
  const [workRef, setWorkRef] = useState<number>();
  const {ghClient, clientInitError} = useGitHubCodeClient()
  useEffect(() => {
    const codeHostKeySet = new Set(hits?.map((h) => h.codeHost));
    if (hits && codeHostKeySet.size === 1) {
      setCodeHostKey(hits[0]?.codeHost)
    }
  }, [hits]);
  useEffect(() => {
    if (!selected) {
      setHits(undefined)
    } else {
      Promise.all(selected.map((s) => pathToSearchHit('local', s)))
        .then((hits) => setHits(hits))
        .catch((e) => setErr(asString(e)))
    }
  }, [selected]);
  const trigger = useCallback(() => {
    if (!title || title.length === 0) {
      setErr('PR Title not set')
      return
    }
    if (!body || body.length === 0) {
      setErr('PR Body not set')
      return
    }
    if (hits)
      ghClient?.createPullRequests({title, body, hits}, (i) => {
        debug(`Made progress: ${i}`)
        setProgress(100.0 * i / hits.length)
      })
        .then((t) => setWorkRef(t.time))
        .catch((e) => {
          const msg = asString(e)
          error(`Failed create pull requests: ${msg}`)
          setErr(msg)
        })
  }, [hits, title, body])

  // Render
  if (clientInitError) {
    return <Alert
      color={"error"}
      variant={"filled"}
    >{clientInitError}</Alert>
  } else if (hits?.length === 0) {
    return <Alert
      color={"error"}
      variant={"filled"}
    >No repos selected</Alert>
  }

  return <Box style={{display: "block", marginTop: '5px'}}>
    {/* Notifications*/}
    <div>
      {err && <Alert
          color={"error"}
          variant={"filled"}
          onClose={() => setErr(undefined)}
      >{err}</Alert>}
      {workRef && <Tooltip title={'Click me to go to the result'}>
          <Alert
              color={"info"}
              variant={"filled"}
              onClose={() => setWorkRef(undefined)}
              onClick={() => nav(`${locations.result.link}/${workRef}`)}
          >Work done</Alert>
      </Tooltip>}
      {!workRef && progress && <Box sx={{width: '100%'}}>
          <LinearProgress
              value={progress}
              variant={"determinate"}
              color={"primary"}
          /> {progress} % done.
      </Box>}
    </div>

    {/* Form */}
    <div>
      <TextField
        value={title}
        onChange={(evt) => setTitle(evt.target.value)}
        fullWidth
        label={'Title'}
      />
    </div>
    <div>
      <TextField
        value={body}
        onChange={(evt) => setBody(evt.target.value)}
        fullWidth
        label={'Body'}
        multiline
        minRows={3}
        placeholder="Body"
      />
    </div>

    {ghClient && <Button
        disabled={!title || !body}
        color={"primary"}
        variant={"contained"}
        onClick={trigger}
    >Create PRs 🚀</Button>}
  </Box>
};
