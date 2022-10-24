import React, {useEffect, useMemo, useState} from "react";
import {GitHubSearchHostSettings} from "../../hooks/MegaContext";
import {logInfo, logWarn} from "../../hooks/logWrapper";
import {PasswordForm} from "./PasswordForm";
import {useMutableState} from "../../hooks/useMutableState";
import {confirm} from "@tauri-apps/api/dialog";
import {Alert, Button, Grid, TextField, Typography} from "@mui/material";
import {useNavigate, useParams} from "react-router-dom";
import {useMutableMegaSettings} from "../../hooks/useMegaSettings";
import {locations} from "../route/locations";

export const GitHubSearchHostSettingsPage: React.FC = () => {
  const {searchHostKey} = useParams()
  const nav = useNavigate()
  const {megaSettings, updateMegaSettings} = useMutableMegaSettings();
  const [settings, setSettings] = useState<GitHubSearchHostSettings | null>(null)
  useEffect(() => {
    if (searchHostKey && megaSettings) {
      setSettings(megaSettings.searchHosts[searchHostKey]?.github ?? null)
    } else {
      setSettings(null)
    }
  }, [megaSettings])
  const [searchHostKeyVal, setSearchHostKeyVal] = useState<string>(searchHostKey ?? '')
  const [searchHostKeySame, setSearchHostKeySame] = useState(0)
  const [searchHost, updateSearchHost, setSearchHost] = useMutableState<GitHubSearchHostSettings>({
    username: '',
    hostType: "SEARCH",
    codeHostKey: 'github.com',
    baseUrl: 'https://api.github.com'
  })
  useEffect(() => {
    if (settings !== null) {
      setSearchHost(settings)
    }
  }, [settings])
  useEffect(() => {
    if (megaSettings !== null) {
      setSearchHostKeySame(Object.keys(megaSettings.searchHosts).filter((it) => it === searchHostKeyVal).length)
    }
  }, [searchHostKeyVal, megaSettings])
  const [validationError, setValidationError] = useState<string | undefined>(undefined)
  useEffect(() => {
    let errors: string[] = [];
    if (searchHostKeyVal.length === 0) errors.push('Search host key cannot be empty')
    if (searchHostKey === undefined && searchHostKeySame > 0) errors.push('Search host key already defined')
    if (searchHostKey !== undefined && searchHostKeySame > 1) errors.push('Search host key already defined')
    if (searchHostKey !== undefined && searchHostKey !== searchHostKeyVal) errors.push('Search host key cannot be changed')
    if (searchHost.username === undefined || searchHost.username.length < 1) errors.push('Username is undefined')
    if (errors.length === 0) setValidationError(undefined); else setValidationError(errors.join(', '));
  }, [searchHost, searchHostKeyVal])
  const header = useMemo(() => searchHostKey === undefined ? 'Create' : `Edit ${searchHostKey}`, [searchHostKey])

  return <>
    <Typography variant={"h4"}>{header}</Typography>
    <Grid>
      <Grid item sm={12} lg={6}>
        <TextField variant={"outlined"} label={'Search Host Key'}
                   disabled={searchHostKey !== undefined}
                   placeholder="Search Host Key"
                   value={searchHostKeyVal}
                   onChange={(event) => setSearchHostKeyVal(event.target.value)}
        />
      </Grid>
      <Grid item sm={12} lg={6}>
        <TextField variant={"outlined"} label={'Username'}
                   placeholder="Username"
                   value={searchHost.username}
                   onChange={(event) => updateSearchHost((draft) => {
                     draft.username = event.target.value
                   })}/>
      </Grid>
    </Grid>
    <Grid>
      <Grid item sm={12} lg={6}>
        <Button
          variant={"contained"}
          color={"primary"}
          disabled={validationError !== undefined}
          onClick={() => {
            if (searchHostKey === undefined) {
              if (searchHostKeyVal.length > 0 && searchHostKeySame === 0) {
                logInfo('Creating new Search host config node')
                updateMegaSettings((settingsDraft) => {
                  settingsDraft.searchHosts[searchHostKeyVal] = {
                    type: 'GITHUB',
                    github: searchHost,
                  }
                });
                nav(locations.settings.link)
              } else {
                logWarn('Failed validation')
              }
            } else if (searchHostKeyVal.length > 0 && searchHostKeySame === 1) {
              logInfo('Updating old Search host config node')
              updateMegaSettings((settingsDraft) => {
                settingsDraft.searchHosts[searchHostKeyVal] = {
                  type: 'GITHUB',
                  github: searchHost,
                }
              })
            }
          }}>
          {searchHostKeyVal ? 'Update' : 'Create'}
        </Button>
      </Grid>
      {validationError ?
        <Grid item sm={12} lg={6}><Alert severity={"warning"} color={"warning"}>{validationError}</Alert></Grid>
        : null
      }
      <Grid item sm={12} lg={6}>
        <Button
          color={"warning"}
          disabled={searchHostKey === undefined || searchHostKey === 'github.com'}
          onClick={() => {
            if (searchHostKey !== undefined) {
              confirm(`Delete ${searchHostKey}?`).then((ans) => {
                if (ans) {
                  updateMegaSettings(settingsDraft => {
                    delete settingsDraft.searchHosts[searchHostKey]
                  });
                  nav(locations.settings.link)
                }
              })
            }
          }}
        >Delete search host</Button>
      </Grid>
      {searchHostKey !== undefined && settings !== undefined ?
        <Grid item sm={12} lg={6}><PasswordForm
          passwordPhrase={'Personal Access Token'}
          username={settings?.username}
          hostname={settings?.baseUrl}
        /></Grid> : null
      }
    </Grid>
    <hr/>
    <div>
      <Button
        variant={"outlined"}
        color={"secondary"}
        onClick={() => nav(locations.settings.link)}
      >Back</Button>
    </div>
  </>;
};
