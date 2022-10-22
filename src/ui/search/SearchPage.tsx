import React, {useEffect, useState} from "react";
import {asString, logError, logInfo, logWarn} from "../../hooks/logWrapper";
import {Alert, Button, MenuItem, Select, TextField, Typography} from "@mui/material";
import {SearchHit} from "./types";
import {SearchHitTable} from "./SearchHitTable";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {useSearchClient} from "./useSearchClient";
import {CloneModal, CloneModalPropsWrapper, useCloneModalProps} from "../manage/clones/clonepage/CloneModal";

export const SearchPage: React.FC = () => {
  const settings = useMegaSettings()
  const [max, setMax] = useState(10)

  const [selected, setSelected] = useState<string>('github.com')
  const {searchClient, searchClientInitError} = useSearchClient(selected)

  const [searchText, setSearchText] = useState('tauri language:typescript')
  const [searching, setSearching] = useState(false)
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const cloneModalPropsWrapper: CloneModalPropsWrapper = useCloneModalProps()
  const cloneModalProps = cloneModalPropsWrapper.cloneModalPropsWrapper
  useEffect(() => {
    cloneModalProps.setSourceString(`Clone from search '${searchText}'`)
  },[searchText])

  return <>
    <CloneModal {...cloneModalPropsWrapper}/>
    <Typography variant={"h4"}>Search</Typography>
    <TextField
      fullWidth
      InputLabelProps={{shrink: true}}
      label={'Search String'}
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
    />
    <Select
      label='Search host'
      labelId="demo-simple-select-label"
      onChange={(event) => {
        setSelected(event.target.value as string)
        logInfo(`onChange ${JSON.stringify(event)}`)
        logInfo(`Selected ${JSON.stringify(selected)}`)
      }}>
      {Object.keys(settings.searchHosts).map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)
      }
    </Select>
    <Select label={'Max hits'} value={max} onChange={(event) => setMax(+event.target.value)}>
      {[10, 50, 100].map((i: number) => <MenuItem value={i}>{i}</MenuItem>)}
    </Select>
    <Button
      variant={"contained"} color={"primary"}
      disabled={searchClient === undefined || searching || searchText === undefined || searchText.length === 0}
      onClick={() => {
        if (searchClient !== undefined) {
          setSearching(true)

          searchClient.searchCode(searchText, max)
            .then((hits) => {
              setSearchHits(hits)
              logInfo(`Found ${hits.length} hits`)
            })
            .catch((e) => logError(`Failed searching ${asString(e)}`))
            .then(_ => logInfo('Done'))
            .then(_ => setSearching(false))
        } else {
          logWarn('Search Client was undefined')
        }
        logInfo('Clicked')
      }}>Search</Button>
    {searchClientInitError !== undefined ?
      <Alert variant={"filled"} color={"error"}>Failed setting up search client: {searchClientInitError}</Alert>
      : null}
    {searching ? <Alert severity={"info"}
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
