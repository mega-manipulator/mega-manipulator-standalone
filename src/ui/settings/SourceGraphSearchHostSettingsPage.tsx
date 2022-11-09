import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMutableMegaSettings} from "../../hooks/useMegaSettings";
import {SourceGraphSearchHostSettings} from "../../hooks/MegaContext";
import {useMutableState} from "../../hooks/useMutableState";
import {Button, FormControl, FormHelperText, Grid, TextField} from "@mui/material";
import {debug, info} from "tauri-plugin-log-api";
import {locations} from "../route/locations";
import {PasswordForm} from "./PasswordForm";

export const SourceGraphSearchHostSettingsPage: React.FC = () => {
  const nav = useNavigate()
  const {searchHostKey} = useParams()
  const {megaSettings, updateMegaSettings} = useMutableMegaSettings();
  const [settings, setSettings] = useState<SourceGraphSearchHostSettings>()
  useEffect(() => {
    if (searchHostKey && megaSettings) {
      setSettings(megaSettings.searchHosts[searchHostKey]?.sourceGraph)
    } else {
      setSettings(undefined)
    }
  }, [megaSettings, searchHostKey])
  const [searchHost, updateSearchHost, setSearchHost] = useMutableState<SourceGraphSearchHostSettings>()
  useEffect(() => {
    if (settings) {
      setSearchHost(settings)
    }
  }, [settings])

  return <>
    <FormControl>
      <FormHelperText>Base URL</FormHelperText>
      <TextField
        value={searchHost?.baseUrl ?? 'https://sourcegraph.com'}
        onChange={(event) => {
          updateSearchHost((dragft) => dragft.baseUrl = event.target.value)
          debug(`onChange ${JSON.stringify(event)}`)
        }}/>
    </FormControl>
    <FormControl>
      <FormHelperText>User name</FormHelperText>
      <TextField
        value={searchHost?.username ?? ''}
        onChange={(event) => {
          updateSearchHost((draft) => draft.username = event.target.value)
          debug(`onChange ${JSON.stringify(event)}`)
        }}/>
    </FormControl>
    <Button onClick={() => {
      updateMegaSettings((draft)=>{
        if (searchHost && searchHostKey){
          draft.searchHosts[searchHostKey].type = "SOURCEGRAPH"
          draft.searchHosts[searchHostKey].sourceGraph = searchHost
        }
      }).then((_) => nav(locations.settings.link))
    }}>Save</Button>
    <div>
      {searchHostKey !== undefined && settings !== undefined ?
        <Grid item sm={12} lg={6}><PasswordForm
          passwordPhrase={'Personal Access Token'}
          username={settings?.username}
          hostname={settings?.baseUrl}
        /></Grid> : null
      }
    </div>
  </>
};
