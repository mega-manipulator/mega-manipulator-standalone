import React, {useContext, useEffect, useState} from "react";
import {MegaContext, SearchHostSettings} from "../../hooks/MegaContext";
import {error, info, warn} from "tauri-plugin-log-api";
import {useGithubClient} from "../../hooks/github.com";
import {Alert, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {SearchHit} from "./types";

export const SearchPage: React.FC = () => {
  const context = useContext(MegaContext)
  const [selected, setSelected] = useState<SearchHostSettings | undefined>(undefined)
  const [searchText, setSearchText] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  let githubClient = useGithubClient('github.com'); // TODO: get from select
  useEffect(() => {
    setSelected(context.settings.value.searchHosts[Object.keys(context.settings.value.searchHosts)[0]])
  }, [context.settings.value])
  return <>
    <p>Search</p>
    <form onSubmit={() => info(`Submit: ${selected}`)}>
      <select onChange={(event) => {
        setSelected(context.settings.value.searchHosts[event.target.value])
        info(`onChange ${JSON.stringify(event)}`)
        info(`Selected ${JSON.stringify(selected)}`)
      }}>
        {Object.keys(context.settings.value.searchHosts).map((k) => <option value={k}>{k}</option>)}
        <option value={'asdf'}>github:_com</option>
      </select>
      <input value={searchText} onChange={(event) => setSearchText(event.target.value)}/>
      <Button
        variant={"contained"} color={"primary"} disabled={githubClient === undefined || searching}
        onClick={() => {
          if (githubClient !== undefined) {
            setSearching(true)
            githubClient.searchCode('amazing language:go', 100)
              .then((hits) => {
                setSearchHits(hits)
                info('Found ' + JSON.stringify(hits))
              })
              .catch((e) => error(`Failed searching github ${e}`))
              .then(_ => info('Done'))
              .then(_ => setSearching(false))
          } else {
            warn('GitHub Client was undefined')
          }
          info('Clicked')
        }}>Search</Button>
    </form>
    {searching ? <Alert severity={"info"}>Search in progress</Alert> : null}
    <TableContainer component={Paper}>
      <Table border={1}>
        <TableHead>
          <TableRow>
            <TableCell>Search Host</TableCell>
            <TableCell>Code Host</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Repo</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {searchHits.map((hit) => <TableRow>
            <TableCell>{hit.searchHost}</TableCell>
            <TableCell>{hit.codeHost}</TableCell>
            <TableCell>{hit.owner}</TableCell>
            <TableCell>{hit.repo}</TableCell>
            <TableCell>{hit.description}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </TableContainer>
  </>
}
