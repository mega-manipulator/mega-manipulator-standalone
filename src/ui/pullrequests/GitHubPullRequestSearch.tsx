import React, {useContext, useEffect, useMemo, useState} from "react";
import {useGitHubCodeClient} from "../search/github/useGitHubSearchClient";
import {Alert, Button, CircularProgress, IconButton, TextField, Tooltip} from "@mui/material";
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import {debug, error} from "tauri-plugin-log-api";
import {open} from '@tauri-apps/api/shell';
import {asString} from "../../hooks/logWrapper";
import {MegaContext} from "../../hooks/MegaContext";
import {GitHubPull} from "../../hooks/github.com";
import {ConditionalSkeleton} from "../ConditionalSkeleton";
import {NumberField, useNumberFieldProps} from "../NumberField";

export const GitHubPullRequestSearch: React.FC = () => {
  const {pullRequests: {setPulls}} = useContext(MegaContext)
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const [searchTerm, setSearchTerm] = useState(`is:pr author:${ghClient?.username} state:open`)
  const [state, setState] = useState<'loading' | 'ready' | 'searching'>('loading');
  useEffect(() => {
    setSearchTerm(`is:pr author:${ghClient?.username} state:open`)
    setState(ghClient ? 'ready' : "loading")
  }, [ghClient]);
  const isOk: boolean = useMemo(() => {
    return !clientInitError
  }, [clientInitError])

  const maxProps = useNumberFieldProps(100, (n: number) => n > 0)

  // Render
  return <>
    {clientInitError && <Alert>{clientInitError}</Alert>}

    <ConditionalSkeleton condition={isOk} tooltipText={<> <CircularProgress/> Couldn&apos;t load correctly</>}>
      <TextField
        label={'Search terms'}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        fullWidth
        placeholder={'GitHub pulls search terms (q)'}
      />
      <NumberField
        text={{label:'Max'}}
        num={maxProps}
      />
      <Button
        disabled={state !== "ready"}
        variant={"contained"}
        color={"primary"}
        onClick={() => {
          debug(`Searching for '${searchTerm}'`)
          setPulls([])
          setState('searching')
          ghClient?.searchPulls(searchTerm, maxProps.value)
            ?.then((items: GitHubPull[]) => {
              setPulls(items)
            })
            ?.catch((e) => error('ERGHT: ' + asString(e)))
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
    </ConditionalSkeleton>
  </>
};
