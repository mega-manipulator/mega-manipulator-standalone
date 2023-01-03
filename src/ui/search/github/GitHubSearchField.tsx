import {useGitHubSearchClient} from "./useGitHubSearchClient";
import React, {useCallback, useContext, useEffect, useRef, useState} from "react";
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
  const [err, setErr] = useState<string>();
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
  const [progress, setProgress] = useState<number>()
  const currentSearchRef: React.MutableRefObject<number> = useRef<number>(0);
  const search = useCallback(() => {
    if (ghClient !== undefined) {
      searchFieldProps?.setState('searching')
      setErr(undefined)
      setProgress(0)
      setSearchHits([])
      currentSearchRef.current = new Date().getTime()
      let promise;
      switch (searchType) {
        case "CODE":
          promise = ghClient.searchCode(searchTerm, max, setProgress, currentSearchRef);
          break;
        case "REPO":
          promise = ghClient.searchRepo(searchTerm, max, setProgress, currentSearchRef);
          break;
        default:
          promise = Promise.reject(`Unknown search type: ${searchType}`)
      }
      if (promise !== undefined) {
        promise
          .then((hits) => {
            setSearchHits(hits)
            info(`Found ${hits.length} hits`)
          })
          .catch((e) => {
            setErr(asString(e, 2))
            error(`Failed searching ${asString(e)}`)
          })
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

    {err && <Tooltip title={<pre>{err}</pre>}><Alert color={"error"} variant={"outlined"}>Error occurred
        😱</Alert></Tooltip>}

    {progress !== undefined && <div><Box sx={{paddingTop: 1, width: '100%'}}>
      {searchFieldProps?.state === 'searching' && currentSearchRef.current !== 0 &&
          <Tooltip title={'Cancel search'}><IconButton onClick={() => {
            currentSearchRef.current = 0
          }}>x</IconButton></Tooltip>}
        <LinearProgress title={'progress'} color={"primary"} value={progress / max * 100}
                        variant={"determinate"}/> {progress}/{max}
    </Box></div>}

    <Button
      variant={"contained"} color={"primary"}
      disabled={searchFieldProps?.state !== 'ready' || searchTerm.length === 0}
      onClick={search}
    >{searchFieldProps?.state === 'searching' && <CircularProgress size={'1em'}/>}Search</Button>

    {docLink && <Tooltip title={`Click to open ${searchType} search documentation in browser`}>
        <IconButton onClick={() => {
          debug('Opening docs')
          open(docLink)
        }}><HelpCenterIcon/></IconButton>
    </Tooltip>}
  </>
}
