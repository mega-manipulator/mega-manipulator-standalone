import {useGitHubSearchClient} from "./useGitHubSearchClient";
import React, {useCallback, useContext, useEffect, useState} from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Tooltip
} from "@mui/material";
import {debug, error, info, warn} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";
import {SearchFieldProps} from "../types";
import {MegaContext} from "../../../hooks/MegaContext";
import {MemorableTextField} from "../../components/MemorableTextField";
import {open} from "@tauri-apps/api/shell";
import HelpCenterIcon from "@mui/icons-material/HelpCenter";
import {MaxHitsField} from "../../components/MaxHitsField";

export interface GitHubSearchFieldProps {
  readonly searchFieldProps: SearchFieldProps;
}

type SearchType = 'CODE' | 'REPO'
const allSearchTypes: SearchType[] = ['REPO', 'CODE']

export const GitHubSearchField: React.FC<GitHubSearchFieldProps> = ({searchFieldProps}) => {
  const {search: {setHits: setSearchHits}} = useContext(MegaContext);
  const {
    ghClient,
    clientInitError
  } = useGitHubSearchClient()
  useEffect(() => {
    searchFieldProps?.setState(ghClient ? 'ready' : 'loading')
  }, [ghClient])
  const [searchTerm, setSearchTerm] = useState('user:mega-manipulator foo');
  const [max, setMax] = useState(100)
  const [searchType, setSearchType] = useState<SearchType>('REPO')
  const [progress, setProgress] = useState<number | null>(null)
  const search = useCallback(() => {
    if (ghClient !== undefined) {
      searchFieldProps?.setState('searching')
      setProgress(null)
      setSearchHits([])
      let promise;
      switch (searchType) {
        case "CODE":
          promise = ghClient.searchCode(searchTerm, max, setProgress);
          break;
        case "REPO":
          promise = ghClient.searchRepo(searchTerm, max, setProgress);
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
          .then(() => info('Done'))
          .then(() => searchFieldProps?.setState("ready"))
      }
    } else {
      warn('Search Client was undefined')
    }
  }, [ghClient, searchFieldProps, setSearchHits, searchType, searchTerm, max]);

  const [docLink, setDocLink] = useState<string | null>(null);
  useEffect(() => {
    switch (searchType) {
      case "CODE":
        setDocLink('https://docs.github.com/en/rest/search#search-code')
        break;
      case "REPO":
        setDocLink('https://docs.github.com/en/rest/search#search-repositories')
        break;
      default:
        setDocLink(null)
    }
  }, [searchType])


  /* RENDER */
  if (clientInitError) {
    return <Alert variant={"filled"} color={"error"}>Failed setting up search client: {clientInitError}</Alert>
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

    <MaxHitsField value={max} setValue={setMax}/>

    <MemorableTextField
      memProps={{
        value: searchTerm,
        valueChange: setSearchTerm,
        saveOnEnter: true,
        enterAction: search,
        megaFieldIdentifier: 'ghCodeSearchField',
      }}
      textProps={{
        fullWidth: true,
        placeholder: 'Search String',
        autoComplete: 'new-password',
      }}
    />

    <Button
      variant={"contained"} color={"primary"}
      disabled={searchFieldProps?.state !== 'ready' || searchTerm.length === 0}
      onClick={search}>{searchFieldProps?.state === 'searching' && <CircularProgress size={'1em'}/>}Search</Button>
    {progress && <Box sx={{width: '50%'}}>
        <LinearProgress value={progress / max * 100} variant={"determinate"}/> {progress}/{max}
    </Box>}
    {docLink && <Tooltip title={`Click to open ${searchType} search documentation in browser`}>
        <IconButton onClick={() => {
          debug('Opening docs')
          open(docLink)
        }}><HelpCenterIcon/></IconButton>
    </Tooltip>}
  </>
}
