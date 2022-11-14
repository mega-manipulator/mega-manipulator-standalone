import {useGitHubClient} from "./useGitHubClient";
import React, {useContext, useEffect, useState} from "react";
import {Alert, Button, FormControl, FormHelperText, MenuItem, Select, TextField} from "@mui/material";
import {error, info, warn} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";
import {SearchFieldProps} from "../types";
import {MegaContext} from "../../../hooks/MegaContext";

export interface GitHubSearchFieldProps {
  readonly searchFieldProps: SearchFieldProps;
}

type SearchType = 'CODE' | 'REPO'
const allSearchTypes: SearchType[] = ['CODE', 'REPO']

export const GitHubSearchField: React.FC<GitHubSearchFieldProps> = ({searchFieldProps}) => {
  const {search: {setHits: setSearchHits}} = useContext(MegaContext);
  const {
    searchClient,
    searchClientInitError
  } = useGitHubClient(searchFieldProps?.searchHostKey)
  useEffect(() => {
    searchFieldProps?.setState(searchClient ? 'ready' : 'loading')
  }, [searchClient])
  const [searchText, setSearchText] = useState('tauri language:typescript')
  const [max, setMax] = useState(100)
  const [searchType, setSearchType] = useState<SearchType>('CODE')
  if (searchClientInitError) {
    return <Alert variant={"filled"} color={"error"}>Failed setting up search client: {searchClientInitError}</Alert>
  }
  return <>
    <FormControl>
      <FormHelperText>Search Type</FormHelperText>
      <Select
        value={searchType}
        onChange={(event) => setSearchType(event.target.value as SearchType)}
      >
        {allSearchTypes.map((t, i) => <MenuItem key={i} value={t}>{t}</MenuItem>)}
      </Select>
    </FormControl>

    <FormControl>
      <FormHelperText>Max hits</FormHelperText>
      <Select
        value={max}
        onChange={(event) => setMax(+event.target.value)}
      >
        {[10, 50, 100, 1000].map((i: number, idx) => <MenuItem key={idx} value={i}>{i}</MenuItem>)}
      </Select>
    </FormControl>

    <TextField
      fullWidth
      InputLabelProps={{shrink: true}}
      label={'Search String'}
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
    />

    <Button
      variant={"contained"} color={"primary"}
      disabled={searchFieldProps?.state !== 'ready' || searchText.length === 0}
      onClick={() => {
        if (searchClient !== undefined) {
          searchFieldProps?.setState('searching')
          setSearchHits([])
          let promise;
          switch (searchType) {
            case "CODE":
              promise = searchClient.searchCode(searchText, max);
              break;
            case "REPO":
              promise = searchClient.searchRepo(searchText, max);
              break;
            default:
              promise = Promise.reject(`Unknown search type: ${searchType}`)
          }
          if (promise !== undefined) {
            promise.then((hits) => {
              setSearchHits(hits)
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
