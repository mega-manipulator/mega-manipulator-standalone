import React, {useCallback, useContext, useEffect, useState} from "react";
import {Alert, Box, Button, TextField} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {pathToSearchHit} from "../../service/file/cloneDir";
import {SearchHit} from "../search/types";
import {asString} from "../../hooks/logWrapper";
import {groupToMap} from "../../service/partition";
import {useGitHubCodeClient} from "../search/github/useGitHubSearchClient";

export const PullRequestView: React.FC = () => {
  const {settings, clones: {selected}} = useContext(MegaContext);
  const [hits, setHits] = useState<SearchHit[]>();
  const [err, setErr] = useState<string>();
  const [workRef, setWorkRef] = useState<number>();
  const [codeHostKeys, setCodeHostKeys] = useState<string[]>();
  const client = useGitHubCodeClient(codeHostKeys ? codeHostKeys[0] : undefined)
  useEffect(() => {
    const codeHostKeySet = new Set(hits?.map((h) => h.codeHost))
    setCodeHostKeys(Array.from(codeHostKeySet.values()))
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
    // TODO!!
    // Code Hosts eval - make sure to split and send with the correct clients
    if (hits) {
      const m = groupToMap(hits, (e) => e.codeHost)
      const codeHostKeys = Object.keys(m)
      for (const codeHostKey of codeHostKeys) {

      }
    }
    // githubClient Create PR
  }, [hits])

  // Render
  return <Box style={{display: "block", marginTop: '5px'}}>
    <div>
      {
        codeHostKeys === undefined ? <Alert severity={"warning"} variant={"filled"}>No clones selected</Alert> :
          codeHostKeys.length === 0 ? <Alert severity={"warning"} variant={"filled"}>No clones selected</Alert> :
            codeHostKeys.length > 1 && <Alert severity={"warning"} variant={"filled"}>Clones from more than 1 code host selected</Alert>
      }
    </div>
    <div>
      <TextField fullWidth label={'Title'}/>
    </div>
    <div>
      <TextField
        fullWidth
        label={'Body'}
        multiline
        minRows={3}
        placeholder="Body"
      />
    </div>
    <Button
      color={"primary"}
      variant={"contained"}
      onClick={trigger}
    >Create PRs 🚀</Button>
  </Box>
};
