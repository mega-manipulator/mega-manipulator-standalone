import React, {useContext, useEffect, useState} from "react";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  Typography
} from "@mui/material";
import {useSearchFieldProps} from "./types";
import {SearchHitTable} from "./SearchHitTable";
import {CloneModal, CloneModalPropsWrapper, useCloneModalProps} from "../manage/clones/clonepage/CloneModal";
import {MegaContext} from "../../hooks/MegaContext";
import {info} from "tauri-plugin-log-api";
import {modalStyle} from "../modal/megaModal";
import ErrorBoundary from "../error/ErrorBoundry";
import {GitHubSearchField} from "./github/GitHubSearchField";
import {LocalSearchField} from "./local/LocalSearchField";
import {SourceGraphSearchField} from "./sourcegraph/SourceGraphSearchField";
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";
import {SearchHostType} from "../../hooks/settings";

export const SearchPage: React.FC = () => {
  const nav = useNavigate()
  const {settings, search:{selected, searchHostKey, setSearchHostKey}} = useContext(MegaContext)
  const searchFieldProps = useSearchFieldProps()

  const cloneModalPropsWrapper: CloneModalPropsWrapper = useCloneModalProps()
  const cloneModalProps = cloneModalPropsWrapper.cloneModalPropsWrapper
  useEffect(() => {
    cloneModalProps.setSourceString(`Clone from search '${searchHostKey}'`)
  }, [searchHostKey])
  const [searchType, setSearchType] = useState<SearchHostType>('LOCAL')
  useEffect(() => {
    let type:SearchHostType = 'LOCAL'
    if (settings && searchFieldProps && searchHostKey) {
      const searchHostSettings = settings.searchHosts[searchHostKey];
      if (searchHostSettings) {
        type = searchHostSettings.type
      }
    }
    setSearchType(type);
  }, [settings, searchFieldProps])

  const searchHostSelect = <FormControl>
    <FormHelperText>Search host</FormHelperText>
    <Select
      value={searchHostKey}
      onChange={(event) => {
        setSearchHostKey(event.target.value as string)
        info(`onChange ${JSON.stringify(event)}`)
      }}>
      {settings && ['LOCAL', ...Object.keys(settings.searchHosts)]
        .map((k,i) => <MenuItem key={i} value={k as SearchHostType}>{k}</MenuItem>)}
    </Select>
  </FormControl>

  return <>
    <Typography variant={"h4"}>Search</Typography>
    <Backdrop open={searchFieldProps?.state === 'loading'}
              sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}>
      {settings && settings.searchHosts && (Object.keys(settings.searchHosts).length > 0) ?
        <Box sx={modalStyle}>
          <CircularProgress/>
          <div>
            {searchHostSelect}
          </div>
          <Button
            variant={"contained"}
            color={"warning"}
            onClick={()=> nav(locations.settings.link)}
          >Take me back to the Settings page</Button>
        </Box> : <ErrorBoundary/>}
    </Backdrop>

    <CloneModal {...cloneModalPropsWrapper}/>

    {searchHostSelect}

    {searchType === 'LOCAL' && <LocalSearchField searchFieldProps={searchFieldProps}/>}
    {searchType === 'GITHUB' && <GitHubSearchField searchFieldProps={searchFieldProps}/>}
    {searchType === 'SOURCEGRAPH' && <SourceGraphSearchField searchFieldProps={searchFieldProps}/>}

    {searchFieldProps?.state === 'searching' ? <Alert severity={"info"}
      >Search in progress</Alert> :
      <Button
        variant={"contained"}
        color={"info"}
        disabled={selected.length === 0}
        onClick={cloneModalProps.open}
      >Clone</Button>}
    <SearchHitTable/>
  </>
}
