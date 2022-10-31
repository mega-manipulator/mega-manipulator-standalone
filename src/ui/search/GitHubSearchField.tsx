import {useSearchClient} from "./useSearchClient";
import React, {useState} from "react";
import {Alert, Button, MenuItem, Select, TextField} from "@mui/material";
import {error, info, warn} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {SearchFieldProps} from "./types";

export class GitHubSearchFieldProps {
  readonly searchFieldProps?: SearchFieldProps;
}

export const GitHubSearchField:React.FC<GitHubSearchFieldProps> = ({searchFieldProps}) => {
  const {searchClient, searchClientInitError} = useSearchClient(searchFieldProps?.searchHostKey ?? null)
  const [searchText, setSearchText] = useState('tauri language:typescript')
  const [max, setMax] = useState(100)
  if (searchClientInitError){
    return <Alert variant={"filled"} color={"error"}>Failed setting up search client: {searchClientInitError}</Alert>
  }
  return <>
    <TextField
      fullWidth
      InputLabelProps={{shrink: true}}
      label={'Search String'}
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
    />
    <Select label={'Max hits'} value={max} onChange={(event) => setMax(+event.target.value)}>
      {[10, 50, 100].map((i: number) => <MenuItem value={i}>{i}</MenuItem>)}
    </Select>
    <Button
      variant={"contained"} color={"primary"}
      disabled={searchFieldProps?.state !== 'ready' || searchText.length === 0}
      onClick={() => {
        if (searchClient !== undefined) {
          searchFieldProps?.setState('searching')
          searchClient.searchCode(searchText, max)
            .then((hits) => {
              searchFieldProps?.setHits(hits)
              info(`Found ${hits.length} hits`)
            })
            .catch((e) => error(`Failed searching ${asString(e)}`))
            .then(_ => info('Done'))
            .then(_ => searchFieldProps?.setState("ready"))
        } else {
          warn('Search Client was undefined')
        }
        info('Clicked')
      }}>Search</Button>
  </>
}
