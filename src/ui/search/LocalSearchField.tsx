import {useLocalSearchClient} from "./LocalSearchClient";
import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, FormControlLabel, MenuItem, Select, TextField} from "@mui/material";
import {SearchFieldProps} from "./types";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";

export class LocalSearchFieldProps {
  readonly searchFieldProps: SearchFieldProps | null | undefined;
}

const programs = [
  'ag',
  //'grep',
  //'ripgrep',
]

export const LocalSearchField: React.FC<LocalSearchFieldProps> = ({searchFieldProps}) => {
  const localSearchClientWrapper = useLocalSearchClient(searchFieldProps?.settings);
  const [program, setProgram] = useState<string>('ag')
  const [search, setSearch] = useState<string>('foo')
  const [file, setFile] = useState<string>('.')
  const [searchError, setSearchError] = useState<string | null>(null)
  useEffect(() => {
    searchFieldProps?.setState(localSearchClientWrapper ? 'ready' : 'loading')
  }, [localSearchClientWrapper])

  if (!searchFieldProps?.settings) {
    return <CircularProgress/>
  }

  return <>
    <FormControlLabel
      label={'Program'}
      control={<Select value={program} onChange={(p) => setProgram(p.target.value)}>
        {programs.map((p, i) => <MenuItem key={i} value={p}>{p}</MenuItem>)}
      </Select>}
    />
    <FormControlLabel
      label={'Search term'}
      control={<TextField value={search} onChange={(e) => setSearch(e.target.value)}/>}
    />
    <FormControlLabel
      label={'FilePattern'}
      control={<TextField value={file} onChange={(e) => setFile(e.target.value)}/>}
    />
    <FormControlLabel
      label={'Max hits'}
      control={<Select value={searchFieldProps.max} onChange={(e) => searchFieldProps.setMax(e.target.value as number)}>
        {[5, 10, 100, 1000, 10000].map((i, index) => <MenuItem key={index} value={i}>{i}</MenuItem>)}
      </Select>}
    />
    {searchError && <Alert color={"error"}>{searchError}</Alert>}
    <Button onClick={() => {
      searchFieldProps?.setState("searching")
      searchFieldProps?.setHits([])
      setSearchError(null)
      localSearchClientWrapper.client?.searchCode(program, search, file, searchFieldProps.max)
        .then((hits) => {
          searchFieldProps?.setHits(hits)
          searchFieldProps?.setState("ready")
        }, (err) => {
          const msg = `Failed searching due to '${asString(err)}'`
          error(msg)
          setSearchError(msg)
        })
    }}>Search</Button>
  </>
}
