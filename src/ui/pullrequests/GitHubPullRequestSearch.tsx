import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {useGitHubCodeClient} from "../search/github/useGitHubSearchClient";
import {Alert, Button, CircularProgress, IconButton, Tooltip} from "@mui/material";
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import {debug, error} from "tauri-plugin-log-api";
import {open} from '@tauri-apps/api/shell';
import {asString} from "../../hooks/logWrapper";
import {MegaContext} from "../../hooks/MegaContext";
import {GitHubPull} from "../../hooks/github.com";
import {NumberField, useNumberFieldProps} from "../components/NumberField";
import {MemorableTextField, useMemorableTextField} from "../components/MemorableTextField";

export const GitHubPullRequestSearch: React.FC = () => {
  const {pullRequests: {setPulls}} = useContext(MegaContext)
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const searchFieldProps = useMemorableTextField({
    megaFieldIdentifier:'ghPrSearch',
    maxMemory: 25,
    defaultValue:``,
  })
  const [state, setState] = useState<'loading' | 'ready' | 'searching'>('loading');
  useEffect(() => {
    if (searchFieldProps.value === ''){
      searchFieldProps.setValue(`is:pr author:${ghClient?.username} state:open`)
    }
    setState(ghClient ? 'ready' : "loading")
  }, [ghClient]);
  const isOk: boolean = useMemo(() => {
    return !clientInitError
  }, [clientInitError])

  const maxProps = useNumberFieldProps(100, (n: number) => n > 0)
  const search = useCallback(() => {
    debug(`Searching for '${searchFieldProps.value}'`)
    setPulls([])
    setState('searching')
    searchFieldProps.saveCallback()
    ghClient?.searchPulls(searchFieldProps.value, maxProps.value)
      ?.then((items: GitHubPull[]) => {
        setPulls(items)
      })
      ?.catch((e) => error('ERGHT: ' + asString(e)))
      ?.finally(() => setState("ready"))
  },[searchFieldProps, ghClient])

  // Render
  return <>
    {clientInitError && <Alert>{clientInitError}</Alert>}
    <MemorableTextField
      {...searchFieldProps}
      label={'Search terms'}
      fullWidth
      placeholder={'GitHub pulls search terms (q)'}
      onKeyUp={(event) => {
        if(event.key === 'Enter'){
          search()
        }
      }}
    />
    <NumberField
      text={{label: 'Max'}}
      num={maxProps}
    />
    <Button
      disabled={state !== "ready" || !isOk}
      variant={"contained"}
      color={"primary"}
      onClick={search}>
      {state === "searching" && <CircularProgress size={"1em"}/>}
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
