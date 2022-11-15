import React, {useContext, useEffect, useState} from "react";
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
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";
import {createDefault, MegaSettingsType} from "../../hooks/settings";
import {error, info} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {NewSearchHostButton} from "./NewSearchHostButton";
import {MegaContext} from "../../hooks/MegaContext";

type SearchHostRowProps = {
  searchHostKey: string,
  settings: MegaSettingsType,
}

function rowStyle(args: { username?: string, baseUrl?: string }): React.CSSProperties {
  const baseCss: React.CSSProperties = {
    cursor: "pointer"
  }
  if (args.username === undefined) {
    return {
      ...baseCss,
      background: "orange",
    };
  }
  if (args.baseUrl === undefined) {
    return {
      ...baseCss,
      background: "red",
    };
  }
  const [password] = usePassword(args.username, args.baseUrl)
  if (!password) {
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
  if (h.type === 'SOURCEGRAPH') {
    return <TableRow
      style={rowStyle({username: h.sourceGraph?.username, baseUrl: h?.sourceGraph?.baseUrl})}
      onClick={() => {
        info('Nav > Edit Search host ' + locations.settings.search.sourcegraph.link);
        nav(`${locations.settings.search.sourcegraph.link}/${searchHostKey}`)
      }
      }>
      <TableCell>{searchHostKey}</TableCell>
      <TableCell>{h.type}</TableCell>
      <TableCell>{h.sourceGraph?.username}</TableCell>
    </TableRow>
  } else if (h.type === 'GITHUB') {
    return <TableRow
      style={rowStyle({username: h.github?.username, baseUrl: h?.github?.baseUrl})}
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
      style={rowStyle({username: h.github?.username, baseUrl: h?.github?.baseUrl})}
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
  const {settings:megaSettings, updateSettings:updateMegaSettings} = useContext(MegaContext)
  const nav = useNavigate()

  const [keepLocalRepos, setKeepLocalRepos] = useState<string >()
  const [clonePath, setClonePath] = useState<string>()
  const [editorApplicationPath, setEditorApplicationPath] = useState<string>();

  const [state, setState] = useState<'loading' | 'ready'>('loading')
  useEffect(() => {
    if (megaSettings !== null) {
      setKeepLocalRepos(megaSettings.keepLocalReposPath)
      setClonePath(megaSettings.clonePath)
      setState('ready')
      setEditorApplicationPath(megaSettings.editorApplication)
    } else {
      setKeepLocalRepos(undefined)
      setClonePath(undefined)
      setEditorApplicationPath(undefined)
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
      <Typography variant={"h4"}>Settings</Typography>
    </span>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          id='keep-local-repos-path-text-field'
          fullWidth
          label='Keep Local Repos path'
          variant="outlined"
          value={keepLocalRepos}
          onChange={(event) => setKeepLocalRepos(event.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          id='clone-repo-path-text-field'
          fullWidth
          label={'Clone Repos path'}
          variant={"outlined"}
          value={clonePath}
          onChange={(event) => setClonePath(event.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          id='editorApplication-text-field'
          fullWidth
          label={'Editor Application path'}
          variant={"outlined"}
          value={editorApplicationPath}
          onChange={(event) => setEditorApplicationPath(event.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant={"contained"}
          onClick={() => {
            updateMegaSettings(async (draft) => {
              if(clonePath) draft.clonePath = clonePath;
              if(keepLocalRepos) draft.keepLocalReposPath = keepLocalRepos;
              if(editorApplicationPath) draft.editorApplication = editorApplicationPath;
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
        <NewSearchHostButton/>
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
