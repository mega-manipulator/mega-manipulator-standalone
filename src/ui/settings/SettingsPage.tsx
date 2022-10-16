import {GitHubSearchHostSettingsPage} from "./GitHubSearchHostSettingsPage";
import React, {useContext, useEffect, useState} from "react";
import {MegaContext, MegaContextType} from "../../hooks/MegaContext";
import {GitHubCodeHostSettingsPage} from "./GitHubCodeHostSettingsPage";
import {error} from "tauri-plugin-log-api";
import {ResetAllSettings} from "./ResetAllSettings";
import {usePassword} from "../../hooks/usePassword";

import {
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from "@mui/material";

type SearchHostRowProps = {
  searchHostKey: string,
  context: MegaContextType,
}

function rowStyle(username?: string, baseUrl?: string): React.CSSProperties | undefined {
  if (username === undefined) {
    return {background: "red"};
  }
  if (baseUrl === undefined) {
    return {background: "red"};
  }
  const [password] = usePassword(username, baseUrl)
  if (password === undefined) {
    return {background: "orange"}
  }
  return undefined
}

const SearchHostRow: React.FC<SearchHostRowProps> = ({context, searchHostKey}) => {
  const h = context.settings.value.searchHosts[searchHostKey];
  if (h.type === 'GITHUB') {
    return <TableRow
      style={rowStyle(h.github?.username, h?.github?.baseUrl)}
      onClick={() => context.navigatePage('Edit: ' + searchHostKey, <GitHubSearchHostSettingsPage
        searchHostKey={searchHostKey}/>)}>
      <TableCell>{searchHostKey} </TableCell>
      <TableCell>{h.type} </TableCell>
    </TableRow>
  } else {
    error(`Unable to determine class of search host ${searchHostKey} :: ${JSON.stringify(h)}`)
    return null
  }
}

type CodeHostRowProps = {
  codeHostKey: string,
  context: MegaContextType,
}

const CodeHostRow: React.FC<CodeHostRowProps> = ({context, codeHostKey}) => {
  const h = context.settings.value.codeHosts[codeHostKey];
  if (h.type === 'GITHUB') {
    return <TableRow
      style={rowStyle(h.github?.username, h?.github?.baseUrl)}
      onClick={() => context.navigatePage('Edit: ' + codeHostKey, <GitHubCodeHostSettingsPage
        codeHostKey={codeHostKey}/>)}>
      <TableCell>{codeHostKey} </TableCell>
      <TableCell>{h.type} </TableCell>
    </TableRow>
  } else {
    error(`Unable to determine class of code host ${codeHostKey} :: ${JSON.stringify(h)}`)
    return null
  }
}

export const SettingsPage = () => {
  const context = useContext(MegaContext)
  const [keepLocalRepos, setKeepLocalRepos] = useState<string | undefined>(undefined)
  const [clonePath, setClonePath] = useState<string | undefined>(undefined)
  useEffect(() => {
    setKeepLocalRepos(context.settings.value.keepLocalReposPath)
    setClonePath(context.settings.value.clonePath)
  }, [context.settings])
  return <>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField fullWidth label={'Keep Local Repos location'} variant={"outlined"}
                   placeholder="File system Location"
                   value={keepLocalRepos}

                   onChange={(event) => setKeepLocalRepos(event.target.value)}/>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth label={'Clone Repos location'} variant={"outlined"}
                   placeholder="File system Location"
                   value={clonePath}
                   onChange={(event) => setClonePath(event.target.value)}/>
      </Grid>
      <Grid item xs={12}>
        <Button variant={"contained"} onClick={() => null}>Save settings</Button>
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item sm={12} md={6}>
        <TableContainer component={Paper}>
          <Table border={1}>
            <TableHead>
              <TableRow>
                <TableCell>SearchHost</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(context.settings.value.searchHosts)
                .map((k, idx) => <SearchHostRow
                  key={idx}
                  searchHostKey={k}
                  context={context}/>)}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant={"contained"}
                onClick={() => context.navigatePage('New search host', <GitHubSearchHostSettingsPage/>)}>Add new
          Search
          host</Button>
      </Grid>
      <Grid item sm={12} md={6}>
        <TableContainer component={Paper}>
          <Table border={1}>
            <TableHead>
              <TableRow>
                <TableCell>CodeHost</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(context.settings.value.codeHosts)
                .map((k, idx) => <CodeHostRow
                  key={idx}
                  codeHostKey={k}
                  context={context}/>)}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant={"contained"} onClick={() => context.navigatePage('New code host', <GitHubCodeHostSettingsPage
          codeHostKey={undefined}/>)}>Add new Code
          host</Button>
      </Grid>
    </Grid>
    <p>
      <ResetAllSettings/>
    </p>
  </>
};
