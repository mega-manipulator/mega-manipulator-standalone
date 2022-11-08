import React, {useEffect, useState} from "react";
import {Alert, Backdrop, Box, Button, CircularProgress, MenuItem, Select, Typography} from "@mui/material";
import {useSearchFieldProps} from "./types";
import {SearchHitTable} from "./SearchHitTable";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {CloneModal, CloneModalPropsWrapper, useCloneModalProps} from "../manage/clones/clonepage/CloneModal";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {info} from "tauri-plugin-log-api";
import {modalStyle} from "../modal/megaModal";
import ErrorBoundary from "../error/ErrorBoundry";
import {GitHubSearchField} from "./GitHubSearchField";
import {LocalSearchField} from "./LocalSearchField";

export const SearchPage: React.FC = () => {
  const settings: MegaSettingsType | null = useMegaSettings()
  const searchFieldProps = useSearchFieldProps(settings)

  const cloneModalPropsWrapper: CloneModalPropsWrapper = useCloneModalProps()
  const cloneModalProps = cloneModalPropsWrapper.cloneModalPropsWrapper
  useEffect(() => {
    cloneModalProps.setSourceString(`Clone from search '${searchFieldProps?.searchHostKey}'`)
  }, [searchFieldProps?.searchHostKey])
  const [searchType, setSearchType] = useState('LOCAL')
  useEffect(() => {
    setSearchType('LOCAL');
    if (settings && searchFieldProps && searchFieldProps.searchHostKey) {
      const searchHostSettings = settings.searchHosts[searchFieldProps.searchHostKey];
      if (searchHostSettings) {
        setSearchType(searchHostSettings.type.toUpperCase())
      }
    }
  }, [settings, searchFieldProps])

  return <>
    <Typography variant={"h4"}>Search</Typography>
    <Backdrop open={searchFieldProps?.state === 'loading'}
              sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}>
      {settings && settings.searchHosts && (Object.keys(settings.searchHosts).length > 0) ?
        <Box sx={modalStyle}>
          <CircularProgress/>
        </Box> : <ErrorBoundary/>}
    </Backdrop>

    <CloneModal {...cloneModalPropsWrapper}/>

    <Select
      label='Search host'
      labelId="demo-simple-select-label"
      value={searchFieldProps?.searchHostKey}
      onChange={(event) => {
        searchFieldProps?.setSearchHostKey(event.target.value as string)
        info(`onChange ${JSON.stringify(event)}`)
      }}>
      {settings && ['LOCAL', ...Object.keys(settings.searchHosts)]
        .map((k,i) => <MenuItem key={i} value={k}>{k}</MenuItem>)}
    </Select>
    {searchType === 'LOCAL' && <LocalSearchField searchFieldProps={searchFieldProps}/>}
    {searchType === 'GITHUB' && <GitHubSearchField searchFieldProps={searchFieldProps}/>}

    {searchFieldProps?.state === 'searching' ? <Alert severity={"info"}
      >Search in progress</Alert> :
      <Button
        variant={"contained"}
        color={"info"}
        disabled={cloneModalProps.searchHits.length === 0}
        onClick={cloneModalProps.open}
      >Clone</Button>}
    <SearchHitTable
      data={searchFieldProps?.hits ?? []}
      selectionCallback={cloneModalProps.setSearchHits}/>
  </>
}
