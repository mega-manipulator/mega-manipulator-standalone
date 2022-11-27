import React, {useContext, useEffect, useState} from "react";
import {useGitHubCodeClient} from "../search/github/useGitHubSearchClient";
import {Alert, Button, CircularProgress, IconButton, TextField, Tooltip} from "@mui/material";
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import {debug, error} from "tauri-plugin-log-api";
import {open} from '@tauri-apps/api/shell';
import {asString} from "../../hooks/logWrapper";
import {MegaContext} from "../../hooks/MegaContext";
import {GitHubPull} from "../../hooks/github.com";

export const GitHubPullRequestSearch: React.FC = () => {
  const {pullRequests:{setPulls}} = useContext(MegaContext)
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const [searchTerm, setSearchTerm] = useState(`is:pr author:${ghClient?.username} state:open`)
  const [state, setState] = useState<'loading' | 'ready' | 'searching'>('loading');
  useEffect(() => {
    setSearchTerm(`is:pr author:${ghClient?.username} state:open`)
    setState(ghClient ? 'ready' : "loading")
  }, [ghClient]);


  const [max, setMax] = useState(100);

  // Render
  if (clientInitError) {
    return <Alert>{clientInitError}</Alert>
  }
  return <>
    <TextField
      label={'Search terms'}
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
      fullWidth
      placeholder={'GitHub pulls search terms (q)'}
    />
    <Button
      disabled={state !== "ready"}
      variant={"contained"}
      color={"primary"}
      onClick={() => {
        debug(`Searching for '${searchTerm}'`)
        setPulls([])
        setState('searching')
        ghClient?.searchPulls(searchTerm, max)
          ?.then((items: GitHubPull[]) => {
            debug('Result!:' + asString(items))
            setPulls(items)
          })
          ?.catch((e)=>error('ERGHT: '+asString(e)))
          ?.finally(() => setState("ready"))
      }}>
      {state === "searching" && <CircularProgress/>}
      Search
    </Button>
    <Tooltip title={'Click to open pull request search documentation in browser'}>
      <IconButton onClick={() => {
        debug('Opening docs')
        open('https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests#search-only-issues-or-pull-requests')
      }}><HelpCenterIcon/></IconButton>
    </Tooltip>
  </>
};
