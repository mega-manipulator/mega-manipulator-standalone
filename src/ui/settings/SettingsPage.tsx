import React, {useEffect, useState} from "react";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {ResetAllSettings} from "./ResetAllSettings";
import {usePassword} from "../../hooks/usePassword";

import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import {useLocation, useNavigate} from "react-router-dom";
import {useMutableMegaSettings} from "../../hooks/useMegaSettings";
import {locations} from "../route/locations";
import {createDefault} from "../../hooks/settings";
import {error, info} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";

type SearchHostRowProps = {
  searchHostKey: string,
  settings: MegaSettingsType,
}

function rowStyle(username?: string, baseUrl?: string): React.CSSProperties {
  const baseCss: React.CSSProperties = {
    cursor: "pointer"
  }
  if (username === undefined) {
    return {
      ...baseCss,
      background: "red",
    };
  }
  if (baseUrl === undefined) {
    return {
      ...baseCss,
      background: "red",
    };
  }
  const [password] = usePassword(username, baseUrl)
  if (password === undefined) {
    return {
      ...baseCss,
      background: "orange",
    };
  }
  return baseCss;
}

const SearchHostRow: React.FC<SearchHostRowProps> = ({settings, searchHostKey}) => {
  const h = settings.searchHosts[searchHostKey];
  const nav = useNavigate()
  if (h.type === 'GITHUB') {
    return <TableRow
      style={rowStyle(h.github?.username, h?.github?.baseUrl)}
      onClick={() => {
        info('Nav > Edit Search host ' + locations.settings.search.github.link);
        nav(`${locations.settings.search.github.link}/${searchHostKey}`)
      }
      }>
      <TableCell>{searchHostKey}</TableCell>
      <TableCell>{h.type} </TableCell>
      <TableCell>{h.github?.username} </TableCell>
    </TableRow>
  } else {
    error(`Unable to determine class of search host ${searchHostKey} :: ${JSON.stringify(h)}`)
    return null
  }
}

type CodeHostRowProps = {
  codeHostKey: string,
  settings: MegaSettingsType,
}

const CodeHostRow: React.FC<CodeHostRowProps> = ({settings, codeHostKey}) => {
  const h = settings.codeHosts[codeHostKey];
  const nav = useNavigate()
  if (h.type === 'GITHUB') {
    return <TableRow
      style={rowStyle(h.github?.username, h?.github?.baseUrl)}
      onClick={() => nav(`${locations.settings.code.github.link}/${codeHostKey}`)}>
      <TableCell>{codeHostKey} </TableCell>
      <TableCell>{h.type} </TableCell>
      <TableCell>{h.github?.username}</TableCell>
    </TableRow>
  } else {
    error(`Unable to determine class of code host ${codeHostKey} :: ${JSON.stringify(h)}`)
    return null
  }
}

export const SettingsPage = () => {
  const {megaSettings, updateMegaSettings} = useMutableMegaSettings()
  const nav = useNavigate()
  const location = useLocation()

  const [keepLocalRepos, setKeepLocalRepos] = useState<string | undefined>(undefined)
  const [clonePath, setClonePath] = useState<string | undefined>(undefined)

  const [state, setState] = useState<'loading' | 'ready'>('loading')
  useEffect(() => {
    if (megaSettings !== null) {
      setKeepLocalRepos(megaSettings.keepLocalReposPath)
      setClonePath(megaSettings.clonePath)
      setState('ready')
    } else {
      setKeepLocalRepos(undefined)
      setClonePath(undefined)
      setState('loading')
    }
  }, [megaSettings])
  if (state === "loading") {
    return <>
      <div><CircularProgress/></div>
      <div>
        If this loading continues forever, it might be due to your saved settings being borked.<br/>
        One way to fix this is by resetting the settings to default state.<br/>
        Passwords will remain in your OS keystore ofc 😉<br/>
        <Button color={"error"} variant={"outlined"} onClick={() => {
          createDefault().then(_ => info('Settings wiped'))
        }}>Wipe settings</Button></div>
    </>
  }
  return <>
    <span>
      <Typography variant={"h4"}>Settings {location.pathname}</Typography>
    </span>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          id='keep-local-repos-location-text-field'
          fullWidth
          label='Keep Local Repos location'
          variant="outlined"
          value={keepLocalRepos}
          onChange={(event) => setKeepLocalRepos(event.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          id='clone-repo-location-text-field'
          fullWidth
          label={'Clone Repos location'}
          variant={"outlined"}
          value={clonePath}
          onChange={(event) => setClonePath(event.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant={"contained"}
          onClick={() => {
            updateMegaSettings((draft) => {
              draft.clonePath = clonePath;
              draft.keepLocalReposPath = keepLocalRepos;
            }).then(_ => info('Updated settings'))
              .catch((e) => error(`Failed updating settings: ${asString(e)}`))
          }}
        >Save settings</Button>
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item sm={12} lg={6}>
        <TableContainer component={Paper}>
          <Table border={1}>
            <TableHead>
              <TableRow>
                <TableCell>SearchHost</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Username</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {megaSettings && Object.keys(megaSettings.searchHosts)
                .map((k) => <SearchHostRow
                  key={k}
                  searchHostKey={k}
                  settings={megaSettings}/>)}
            </TableBody>
          </Table>
        </TableContainer>
        <Button onClick={() => nav(locations.settings.search.github.link)} variant={"contained"}>Add new Search
          host</Button>
      </Grid>
      <Grid item sm={12} lg={6}>
        <TableContainer component={Paper}>
          <Table border={1}>
            <TableHead>
              <TableRow>
                <TableCell>CodeHost</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Username</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {megaSettings && Object.keys(megaSettings.codeHosts)
                .map((k, idx) => <CodeHostRow
                  key={idx}
                  codeHostKey={k}
                  settings={megaSettings}/>)}
            </TableBody>
          </Table>
        </TableContainer>
        <Button onClick={() => nav(locations.settings.code.github.link)} variant={"contained"}>Add new Code
          host</Button>
      </Grid>
    </Grid>
    <p>
      <ResetAllSettings/>
    </p>
  </>
};
