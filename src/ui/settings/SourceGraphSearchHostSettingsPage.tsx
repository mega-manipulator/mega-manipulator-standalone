import React, {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMutableMegaSettings} from "../../hooks/useMegaSettings";
import {MegaSettingsType, SourceGraphSearchHostSettings} from "../../hooks/MegaContext";
import {useMutableState} from "../../hooks/useMutableState";
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import {debug} from "tauri-plugin-log-api";
import {locations} from "../route/locations";
import {PasswordForm} from "./PasswordForm";
import {asString} from "../../hooks/logWrapper";
import DeleteIcon from '@mui/icons-material/Delete';

function codeHostStyle(key: string, settings: MegaSettingsType | undefined | null): React.CSSProperties {
  if (settings && !settings.codeHosts[key]) {
    debug('ERGHT')
    return {
      background: "orange"
    }
  } else {
    return {};
  }
}

export const SourceGraphSearchHostSettingsPage: React.FC = () => {
  const nav = useNavigate()
  const {searchHostKey} = useParams()
  const [newSearchHostKey, setNewSearchHostKey] = useState<string>()
  const {megaSettings, updateMegaSettings} = useMutableMegaSettings();
  const [settings, setSettings] = useState<SourceGraphSearchHostSettings>()

  const [newMappingKey, setNewMappingKey] = useState<string>()
  const [newMappingValue, setNewMappingValue] = useState<string>()

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
    } else {
      setSearchHost({
        username: 'NotReallyNeededExceptForMultiUserSetup',
        hostType: "SEARCH",
        codeHosts: {},
        baseUrl: 'http://localhost:7080'
      })
    }
  }, [settings])
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  useEffect(() => {
    const errAggregate: string[] = []
    if (!searchHostKey) {
      if (!newSearchHostKey || newSearchHostKey.length === 0) {
        errAggregate.push('Search host key is not defined')
      } else {
        if (megaSettings?.codeHosts[newSearchHostKey]) {
          errAggregate.push('Search host key is already taken')
        }
      }
    }
    if (!searchHost?.username || searchHost.username.length === 0) {
      errAggregate.push('Username not set')
    }
    if (!searchHost?.baseUrl || !searchHost.baseUrl.match(/^https?:\/\/.*[^/]$/g)) {
      errAggregate.push('BaseURL is not correct')
    }
    setErrors(errAggregate)
    const warnAggregate: string[] = []
    if (!searchHost?.codeHosts || Object.keys(searchHost.codeHosts).length === 0) {
      warnAggregate.push('Code Host Mapping empty')
    } else {
      Object.values(searchHost.codeHosts).forEach((codeHost) => {
        if (!megaSettings?.codeHosts[codeHost]) {
          warnAggregate.push(`Incorrect code host mapping, code host '${codeHost}' does not exist`)
        }
      })
    }
    setWarnings(warnAggregate)
  }, [searchHost, searchHostKey])
  const validateSearchHost: boolean = useMemo(() => {
    return errors.length === 0;
  }, [errors])

  const header = useMemo(() => `${searchHostKey === undefined ? 'Create' : `Edit ${searchHostKey}`} (SourceGraph Search Host)`, [searchHostKey])

  return <>
    <Typography variant={"h4"}>{header}</Typography>
    <div>
      {errors.map((err) => <Alert variant={"filled"} severity={"error"}>{err}</Alert>)}
      {warnings.map((w) => <Alert variant={"filled"} severity={"warning"}>{w}</Alert>)}
    </div>
    {!searchHostKey && <FormControl>
        <FormHelperText>Search host key</FormHelperText>
        <TextField
            value={newSearchHostKey}
            onChange={(event) => {
              setNewSearchHostKey(event.target.value)
            }}
        />
    </FormControl>}
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
      <FormHelperText>User name (Only used for multi-user password storage reasons)</FormHelperText>
      <TextField
        value={searchHost?.username ?? 'not-really-needed'}
        onChange={(event) => {
          updateSearchHost((draft) => draft.username = event.target.value)
          debug(`onChange ${JSON.stringify(event)}`)
        }}/>
    </FormControl>
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>SourceGraph code host naming</TableCell>
            <TableCell>Your code host naming</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {searchHost?.codeHosts && Object.keys(searchHost.codeHosts).map((key, index) => <TableRow key={index}>
            <TableCell>{key}</TableCell>
            <TableCell
              style={codeHostStyle(searchHost.codeHosts[key], megaSettings)}
            >{searchHost.codeHosts[key]}</TableCell>
            <TableCell>
              <IconButton onClick={() => {
                updateSearchHost((draft) => {
                  delete draft.codeHosts[key]
                })
              }}
              ><DeleteIcon/></IconButton>
            </TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
      <TextField
        label={'New Sourcegraph mapping name'}
        value={newMappingKey}
        onChange={(event) => setNewMappingKey(event.target.value)}
      />
      <TextField
        label={'New Code Host mapping key'}
        value={newMappingValue}
        onChange={(event) => setNewMappingValue(event.target.value)}
      />
      <Button
        variant={"outlined"}
        onClick={() => {
          updateSearchHost((draft) => {
            if (newMappingKey && newMappingKey.length > 0 && newMappingValue && newMappingValue.length > 0) {
              draft.codeHosts[newMappingKey] = newMappingValue
            }
          })
        }}
      >Add Mapping</Button>
    </div>
    <div>
      <Button
        variant={"outlined"}
        color={"primary"}
        disabled={!validateSearchHost}
        onClick={() => {
          if (searchHost && validateSearchHost) {
            updateMegaSettings((draft) => {
              if (searchHostKey) {
                draft.searchHosts[searchHostKey].type = "SOURCEGRAPH"
                draft.searchHosts[searchHostKey].sourceGraph = searchHost
              } else if (newSearchHostKey) {
                draft.searchHosts[newSearchHostKey] = {
                  type: "SOURCEGRAPH",
                  sourceGraph: searchHost,
                }
              }
            }).then((_) => nav(locations.settings.link))
              .catch((e) => setErrors([...errors, asString(e)]))
          }
        }}>Save</Button>
    </div>
    <div>
      {searchHostKey !== undefined && settings !== undefined ?
        <Grid item sm={12} lg={6}><PasswordForm
          passwordPhrase={'Personal Access Token'}
          username={settings?.username}
          hostname={settings?.baseUrl}
        /></Grid> : null
      }
    </div>
    <Button variant={"outlined"} color={"secondary"} onClick={() => nav(locations.settings.link)}>Back</Button>
  </>
};
