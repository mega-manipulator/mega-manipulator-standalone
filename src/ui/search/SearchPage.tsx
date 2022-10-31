import React, {useEffect, useState} from "react";
import {asString} from "../../hooks/logWrapper";
import {Alert, Backdrop, Box, Button, CircularProgress, MenuItem, Select, TextField, Typography} from "@mui/material";
import {SearchHit, SearchPageState} from "./types";
import {SearchHitTable} from "./SearchHitTable";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {useSearchClient} from "./useSearchClient";
import {CloneModal, CloneModalPropsWrapper, useCloneModalProps} from "../manage/clones/clonepage/CloneModal";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {error, info, warn} from "tauri-plugin-log-api";
import {modalStyle} from "../modal/megaModal";
import ErrorBoundary from "../error/ErrorBoundry";

export const SearchPage: React.FC = () => {
  const settings: MegaSettingsType | null = useMegaSettings()
  const [state, setState] = useState<SearchPageState>('loading')
  const [max, setMax] = useState(10)
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => {
    if (settings && settings.searchHosts && Object.keys(settings.searchHosts).length > 0) {
      setSelected(Object.keys(settings.searchHosts)[0])
    } else {
      setSelected(null)
    }
  }, [settings])

  const {searchClient, searchClientInitError} = useSearchClient(selected)
  const [searchText, setSearchText] = useState('tauri language:typescript')
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const cloneModalPropsWrapper: CloneModalPropsWrapper = useCloneModalProps()
  const cloneModalProps = cloneModalPropsWrapper.cloneModalPropsWrapper
  useEffect(() => {
    cloneModalProps.setSourceString(`Clone from search '${searchText}'`)
  }, [searchText])
  useEffect(() => {
    if (settings === null || searchClient === undefined) {
      setState('loading')
    } else {
      setState('ready')
    }
  }, [settings, searchClient])

  const searchHostSelect = <Select
    label='Search host'
    labelId="demo-simple-select-label"
    value={selected}
    onChange={(event) => {
      setSelected(event.target.value as string)
      info(`onChange ${JSON.stringify(event)}`)
      info(`Selected ${JSON.stringify(selected)}`)
    }}>
    {settings && Object.keys(settings.searchHosts)
      .map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}
  </Select>

  return <>
    <Typography variant={"h4"}>Search</Typography>
    <Backdrop open={state === 'loading'} sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}>
      {settings && settings.searchHosts && (Object.keys(settings.searchHosts).length > 0) ?
        <Box sx={modalStyle}>
          <CircularProgress/>
          {searchHostSelect}
        </Box> : <ErrorBoundary/>}
    </Backdrop>

    <CloneModal {...cloneModalPropsWrapper}/>
    <TextField
      fullWidth
      InputLabelProps={{shrink: true}}
      label={'Search String'}
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
    />
    {searchHostSelect}
    <Select label={'Max hits'} value={max} onChange={(event) => setMax(+event.target.value)}>
      {[10, 50, 100].map((i: number) => <MenuItem value={i}>{i}</MenuItem>)}
    </Select>
    <Button
      variant={"contained"} color={"primary"}
      disabled={state !== 'ready' || searchText.length === 0}
      onClick={() => {
        if (searchClient !== undefined) {
          setState('searching')
          searchClient.searchCode(searchText, max)
            .then((hits) => {
              setSearchHits(hits)
              info(`Found ${hits.length} hits`)
            })
            .catch((e) => error(`Failed searching ${selected} '${asString(e)}'`))
            .then(_ => info('Done'))
            .then(_ => setState("ready"))
        } else {
          warn('Search Client was undefined')
        }
        info('Clicked')
      }}>Search</Button>
    {searchClientInitError !== undefined ?
      <Alert variant={"filled"} color={"error"}>Failed setting up search client: {searchClientInitError}</Alert>
      : null}
    {state === 'searching' ? <Alert severity={"info"}
      >Search in progress</Alert> :
      <Button
        variant={"contained"}
        color={"info"}
        disabled={cloneModalProps.searchHits.length === 0}
        onClick={cloneModalProps.open}
      >Clone</Button>}
    <SearchHitTable
      data={searchHits}
      selectionCallback={cloneModalProps.setSearchHits}/>
  </>
}
