import {useLocalSearchClient} from "./LocalSearchClient";
import React, {useCallback, useContext, useEffect, useState} from "react";
import {Alert, Button, CircularProgress, FormControl, FormHelperText, MenuItem, Select} from "@mui/material";
import {SearchFieldProps} from "../types";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";
import {useCodeHostFilter, useOwnerFilter, useRepoFilter} from "./useLocalHitFilters";
import {MegaContext} from "../../../hooks/MegaContext";
import {MemorableTextField} from "../../components/MemorableTextField";
import {MaxHitsField} from "../../components/MaxHitsField";

export interface LocalSearchFieldProps {
  readonly searchFieldProps: SearchFieldProps;
}

const programs = [
  'ag',
  //'grep',
  //'ripgrep',
]

export const LocalSearchField: React.FC<LocalSearchFieldProps> = ({searchFieldProps}) => {
  const {settings, search: {setHits: setSearchHits}} = useContext(MegaContext);
  const localSearchClientWrapper = useLocalSearchClient(settings);
  const [program, setProgram] = useState<string>('ag')
  const [searchTerm, setSearchTerm] = useState<string>('foo')
  const [file, setFile] = useState<string>('.')
  const [searchError, setSearchError] = useState<string | null>(null)
  useEffect(() => {
    searchFieldProps?.setState(localSearchClientWrapper ? 'ready' : 'loading')
  }, [localSearchClientWrapper, searchFieldProps])

  const [codeHost, setCodeHost] = useState<string>('*')
  const [owner, setOwner] = useState<string>('*')
  const [repo, setRepo] = useState<string>('*')
  const codeHosts = useCodeHostFilter(settings)
  const owners = useOwnerFilter(settings, codeHost)
  const repos = useRepoFilter(settings, codeHost, owner)

  const search = useCallback(() => {
    searchFieldProps?.setState("searching")
    setSearchHits([])
    setSearchError(null)
    localSearchClientWrapper.client?.searchCode(program, searchTerm, file, searchFieldProps.max, codeHost, owner, repo)
      .then((hits) => {
        setSearchHits(hits)
        searchFieldProps?.setState("ready")
      }, (err) => {
        const msg = `Failed searching due to '${asString(err)}'`
        error(msg)
        setSearchError(msg)
      })
  }, [searchFieldProps, setSearchHits, localSearchClientWrapper.client, program, searchTerm, file, codeHost, owner, repo])

  if (!settings) {
    return <CircularProgress/>
  }
  return <>
    <FormControl>
      <FormHelperText>Code Host</FormHelperText>
      <Select
        value={codeHost}
        onChange={(p) => setCodeHost(p.target.value)}
      >
        {['*', ...(codeHosts ?? [])].map((p, i) => <MenuItem
          key={i} value={p}>{p}</MenuItem>)}
      </Select>
    </FormControl>

    <FormControl>
      <FormHelperText>Owner</FormHelperText>
      <Select
        value={owner}
        onChange={(p) => setOwner(p.target.value)}
      >
        {['*', ...(owners ?? [])].map((p, i) => <MenuItem
          key={i} value={p}>{p}</MenuItem>)}
      </Select>
    </FormControl>

    <FormControl>
      <FormHelperText>Repo</FormHelperText>
      <Select
        value={repo}
        onChange={(p) => setRepo(p.target.value)}
      >
        {['*', ...(repos ?? [])].map((p, i) => <MenuItem
          key={i} value={p}>{p}</MenuItem>)}
      </Select>
    </FormControl>

    <FormControl>
      <FormHelperText>Program</FormHelperText>
      <Select
        value={program}
        onChange={(p) => setProgram(p.target.value)}
      >
        {programs.map((p, i) => <MenuItem key={i} value={p}>{p}</MenuItem>)}
      </Select>
    </FormControl>
    <FormControl style={{width: `${Math.max(10, (file.length * 0.5))}em`}}>
      <FormHelperText>Search Term</FormHelperText>
      <MemorableTextField
        memProps={{
          value:searchTerm,
          valueChange: setSearchTerm,
          maxMemory:25,
          saveOnEnter:true,
          enterAction: search,
          megaFieldIdentifier: 'localSearchTermField',
        }}
      />
    </FormControl>
    <FormControl style={{width: `${Math.max(10, (file.length * 0.5))}em`}}>
      <FormHelperText>File Pattern</FormHelperText>
      <MemorableTextField
        memProps={{
          value:file,
          valueChange: setFile,
          maxMemory:25,
          saveOnEnter:true,
          enterAction: search,
          megaFieldIdentifier: 'localSearchFileField',
        }}
      />
    </FormControl>
    <MaxHitsField value={searchFieldProps.max} setValue={searchFieldProps.setMax}/>
    {searchError && <Alert color={"error"}>{searchError}</Alert>}
    <Button
      variant={"contained"}
      color={"primary"}
      onClick={search}
    >Search</Button>
  </>
}
