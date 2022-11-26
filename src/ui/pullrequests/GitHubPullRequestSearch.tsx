import React, {useState} from "react";
import {useGitHubCodeClient} from "../search/github/useGitHubSearchClient";
import {Alert, Button, IconButton, TextField, Tooltip} from "@mui/material";
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import {debug, error} from "tauri-plugin-log-api";
import {open} from '@tauri-apps/api/shell';
import {asString} from "../../hooks/logWrapper";

export const GitHubPullRequestSearch: React.FC = () => {
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const [searchTerm, setSearchTerm] = useState(`is:pr author:${ghClient?.username} state:open`)

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
      variant={"contained"}
      color={"primary"}
      onClick={() => {
        debug('Searching for ')
        ghClient?.searchPulls(searchTerm, 100)
          ?.then((items) => debug('Result!:' + asString(items)))
          ?.catch((e)=>error('ERGHT: '+asString(e)))
      }}
    >Search</Button>
    <Tooltip title={'Click to open pull request search documentation in browser'}>
      <IconButton onClick={() => {
        debug('Opening docs')
        open('https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests#search-only-issues-or-pull-requests')
      }}><HelpCenterIcon/></IconButton>
    </Tooltip>
  </>
};
