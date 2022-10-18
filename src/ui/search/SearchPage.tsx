import React, {useEffect, useState} from "react";
import {logError, logInfo, logWarn} from "../../hooks/logWrapper";
import {useGithubClient} from "../../hooks/github.com";
import {Alert, Button, Grid, MenuItem, Select, TextField} from "@mui/material";
import {SearchHit} from "./types";
import {SearchHitTable} from "./SearchHitTable";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {AppMenu} from "../menu/Menu";


export const SearchPage: React.FC = () => {
  const settings = useMegaSettings()
  const [max, setMax] = useState(10)

  const [selected, setSelected] = useState<string | null>(null)
  //const selectedSettings = useMemo<SearchHostSettings | undefined>(() => selected ? settings.searchHosts[selected] : undefined, [selected])
  const [searchText, setSearchText] = useState('tauri jensim language:typescript')
  const [searching, setSearching] = useState(false)
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const [selectedHits, setSelectedHits] = useState<SearchHit[]>([])
  useEffect(() => {
    logInfo('Currently selected rows: ' + JSON.stringify(selectedHits.map((hit) => hit.repo)))
  }, [selectedHits])
  const {gitHubClient, gitHubClientInitError} = useGithubClient(selected || undefined)

  return <>
    <AppMenu/>
    <Grid container width={"100%"}>
      <Grid container width={"100%"}>
        <Grid item xs={12} md={1} xl={1}>
          <Select
            label='Search host'
            labelId="demo-simple-select-label"
            onChange={(event) => {
              setSelected(event.target.value as string)
              logInfo(`onChange ${JSON.stringify(event)}`)
              logInfo(`Selected ${JSON.stringify(selected)}`)
            }}>
            {Object.keys(settings.searchHosts).map((k) => <MenuItem value={k}>{k}</MenuItem>)}
          </Select>
        </Grid>
        <Grid item xs={12} md={10} xl={8}>
          <TextField
            fullWidth
            InputLabelProps={{shrink: true}}
            label={'Search String'}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={1} xl={1}>
          <Select label={'Max hits'} value={max} onChange={(event) => setMax(+event.target.value)}>
            {[10, 50, 100].map((i: number) => <MenuItem value={i}>{i}</MenuItem>)}
          </Select>
        </Grid>
        <Grid item xs={12} md={1} xl={1}>
          <Button
            variant={"contained"} color={"primary"}
            disabled={gitHubClient === undefined || searching || searchText === undefined || searchText.length === 0}
            onClick={() => {
              if (gitHubClient !== undefined) {
                setSearching(true)
                gitHubClient.searchCode(searchText, max)
                  .then((hits) => {
                    setSearchHits(hits)
                    logInfo(`Found ${hits.length} hits`)
                  })
                  .catch((e) => logError(`Failed searching github ${e}`))
                  .then(_ => logInfo('Done'))
                  .then(_ => setSearching(false))
              } else {
                logWarn('GitHub Client was undefined')
              }
              logInfo('Clicked')
            }}>Search</Button>
        </Grid>
      </Grid>
      <Grid container width={"100%"}>
        {gitHubClientInitError !== undefined ?
          <Alert variant={"filled"} color={"error"}>Failed setting up github client: {gitHubClientInitError}</Alert>
          : null}
        <Grid item xs={12} xl={12}>
          {searching ? <Alert severity={"info"}
            >Search in progress</Alert> :
            <Button
              variant={"contained"}
              color={"info"}
              disabled={selectedHits.length === 0}
              onClick={() => window.alert('TODO: Open modal for clone')}
            >Clone</Button>}
        </Grid>
      </Grid>
      <Grid container width={"100%"}>
        <Grid item xs={12} xl={12}>
          <SearchHitTable
            data={searchHits}
            selectionCallback={setSelectedHits}/>
        </Grid>
      </Grid>
    </Grid>
  </>
}
