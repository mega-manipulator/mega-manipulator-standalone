import {useGitHubClient} from "./useGitHubClient";
import React, {useEffect, useState} from "react";
import {Alert, Button, FormControlLabel, MenuItem, Select, TextField} from "@mui/material";
import {error, info, warn} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {SearchFieldProps} from "./types";

export class GitHubSearchFieldProps {
  readonly searchFieldProps: SearchFieldProps | null | undefined;
}

type SearchType = 'CODE' | 'REPO'
const allSearchTypes: SearchType[] = ['CODE', 'REPO']

export const GitHubSearchField: React.FC<GitHubSearchFieldProps> = ({searchFieldProps}) => {
  const {
    searchClient,
    searchClientInitError
  } = useGitHubClient(searchFieldProps?.settings, searchFieldProps?.searchHostKey)
  useEffect(() => {
    if (searchClient) {
      searchFieldProps?.setState('ready')
    }
  }, [searchClient])
  const [searchText, setSearchText] = useState('tauri language:typescript')
  const [max, setMax] = useState(100)
  const [searchType, setSearchType] = useState<SearchType>('CODE')
  if (searchClientInitError) {
    return <Alert variant={"filled"} color={"error"}>Failed setting up search client: {searchClientInitError}</Alert>
  }
  return <>
    <FormControlLabel
      label={'Search Type'}
      control={<Select value={searchType} onChange={(event) => setSearchType(event.target.value as SearchType)}>
        {allSearchTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
      </Select>}
    />
    <TextField
      fullWidth
      InputLabelProps={{shrink: true}}
      label={'Search String'}
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
    />
    <Select label={'Max hits'} value={max} onChange={(event) => setMax(+event.target.value)}>
      {[10, 50, 100, 1000].map((i: number) => <MenuItem value={i}>{i}</MenuItem>)}
    </Select>
    <Button
      variant={"contained"} color={"primary"}
      disabled={searchFieldProps?.state !== 'ready' || searchText.length === 0}
      onClick={() => {
        if (searchClient !== undefined) {
          searchFieldProps?.setState('searching')
          searchFieldProps?.setHits([])
          let promise;
          if (searchType === 'CODE') {
            promise = searchClient.searchCode(searchText, max);
          }
          if (promise !== undefined) {
            promise.then((hits) => {
              searchFieldProps?.setHits(hits)
              info(`Found ${hits.length} hits`)
            })
              .catch((e) => error(`Failed searching ${asString(e)}`))
              .then(_ => info('Done'))
              .then(_ => searchFieldProps?.setState("ready"))
          }
        } else {
          warn('Search Client was undefined')
        }
        info('Clicked')
      }}>Search</Button>
  </>
}
