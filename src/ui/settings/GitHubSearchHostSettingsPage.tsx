import React, { useContext, useEffect, useMemo, useState } from 'react';
import { GitHubSearchHostSettings } from '../../hooks/settings';
import { PasswordForm } from './PasswordForm';
import { useMutableState } from '../../hooks/useMutableState';
import { confirm } from '@tauri-apps/api/dialog';
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { locations } from '../route/locations';
import { info, warn } from 'tauri-plugin-log-api';
import { MegaContext } from '../../hooks/MegaContext';

const defaultSearchHost: GitHubSearchHostSettings = {
  baseUrl: 'https://api.github.com',
  hostType: 'SEARCH',
  username: '',
  codeHostKey: 'github.com',
};

export const GitHubSearchHostSettingsPage: React.FC = () => {
  const { searchHostKey } = useParams();
  const nav = useNavigate();
  const { settings: megaSettings, updateSettings: updateMegaSettings } =
    useContext(MegaContext);
  const [settings, setSettings] = useState<GitHubSearchHostSettings | null>(
    null
  );
  useEffect(() => {
    if (searchHostKey && megaSettings) {
      setSettings(megaSettings.searchHosts[searchHostKey]?.github ?? null);
    } else {
      setSettings(null);
    }
  }, [megaSettings, searchHostKey]);
  const [searchHostKeyVal, setSearchHostKeyVal] = useState<string>(
    searchHostKey ?? ''
  );
  const [searchHostKeySame, setSearchHostKeySame] = useState(0);
  const [searchHost, updateSearchHost, setSearchHost] =
    useMutableState<GitHubSearchHostSettings>(defaultSearchHost);
  useEffect(() => {
    if (settings !== null) {
      setSearchHost(settings);
    }
  }, [setSearchHost, settings]);
  useEffect(() => {
    if (megaSettings !== null) {
      setSearchHostKeySame(
        Object.keys(megaSettings.searchHosts).filter(
          (it) => it === searchHostKeyVal
        ).length
      );
    }
  }, [searchHostKeyVal, megaSettings]);
  const [validationError, setValidationError] = useState<string>();
  useEffect(() => {
    const errors: string[] = [];
    if (searchHostKeyVal.length === 0)
      errors.push('Search host key cannot be empty');
    if (searchHostKey === undefined && searchHostKeySame > 0)
      errors.push('Search host key already defined');
    if (searchHostKey !== undefined && searchHostKeySame > 1)
      errors.push('Search host key already defined');
    if (searchHostKey !== undefined && searchHostKey !== searchHostKeyVal)
      errors.push('Search host key cannot be changed');
    if (searchHost?.username === undefined || searchHost.username.length < 1)
      errors.push('Username is undefined');
    if (searchHost?.baseUrl === undefined || searchHost.baseUrl.length < 1)
      errors.push('BaseURL is undefined');
    if (
      searchHost?.baseUrl !== undefined &&
      !searchHost.baseUrl.match(/^https*:\/\/.*[^/]$/)
    )
      errors.push('BaseURL is malformed');
    if (
      searchHost?.baseUrl !== undefined &&
      (searchHost.baseUrl.startsWith('https://github.com') ||
        searchHost.baseUrl.startsWith('http://github.com'))
    )
      errors.push('GitHub base url is https://api.github.com');
    if (
      searchHost?.baseUrl !== undefined &&
      (searchHost.baseUrl.startsWith('https://api.github.com') ||
        searchHost.baseUrl.startsWith('http://api.github.com')) &&
      searchHost.baseUrl !== 'https://api.github.com'
    )
      errors.push('GitHub base url is https://api.github.com');
    if (errors.length === 0) setValidationError(undefined);
    else setValidationError(errors.join(', '));
  }, [searchHost, searchHostKeyVal, searchHostKey, searchHostKeySame]);
  const header = useMemo(
    () =>
      `${
        searchHostKey === undefined ? 'Create' : `Edit ${searchHostKey}`
      } (GitHub Search Host)`,
    [searchHostKey]
  );

  return (
    <>
      <Typography variant={'h4'}>{header}</Typography>
      <Grid>
        <Grid item sm={12} lg={6}>
          <FormControl>
            <FormHelperText>Search Host Key</FormHelperText>
            <TextField
              variant={'outlined'}
              disabled={searchHostKey !== undefined}
              placeholder="Search Host Key"
              value={searchHostKeyVal}
              onChange={(event) => setSearchHostKeyVal(event.target.value)}
            />
          </FormControl>
        </Grid>
        <Grid item sm={12} lg={6}>
          <FormControl>
            <FormHelperText>Username</FormHelperText>
            <TextField
              variant={'outlined'}
              placeholder="Username"
              value={searchHost?.username}
              onChange={(event) =>
                updateSearchHost((draft) => {
                  draft.username = event.target.value;
                })
              }
            />
          </FormControl>
        </Grid>
        <Grid item sm={12} lg={6}>
          <FormControl>
            <FormHelperText>BaseURL</FormHelperText>
            <TextField
              variant={'outlined'}
              placeholder="BaseURL"
              value={searchHost?.baseUrl}
              onChange={(event) =>
                updateSearchHost((draft) => {
                  draft.baseUrl = event.target.value;
                })
              }
            />
          </FormControl>
        </Grid>
      </Grid>
      <Grid>
        <Grid item sm={12} lg={6}>
          <Button
            variant={'contained'}
            color={'primary'}
            disabled={validationError !== undefined}
            onClick={() => {
              if (searchHostKey === undefined) {
                if (searchHostKeyVal.length > 0 && searchHostKeySame === 0) {
                  info('Creating new Search host config node');
                  updateMegaSettings(async (settingsDraft) => {
                    settingsDraft.searchHosts[searchHostKeyVal] = {
                      type: 'GITHUB',
                      github: searchHost,
                    };
                  });
                  nav(locations.settings.link);
                } else {
                  warn('Failed validation');
                }
              } else if (
                searchHostKeyVal.length > 0 &&
                searchHostKeySame === 1
              ) {
                info('Updating old Search host config node');
                updateMegaSettings(async (settingsDraft) => {
                  settingsDraft.searchHosts[searchHostKeyVal] = {
                    type: 'GITHUB',
                    github: searchHost,
                  };
                });
              }
            }}
          >
            {searchHostKeyVal ? 'Update' : 'Create'}
          </Button>
        </Grid>
        {validationError && (
          <Grid item sm={12} lg={6}>
            <Alert severity={'warning'} color={'warning'}>
              {validationError}
            </Alert>
          </Grid>
        )}
        <Grid item sm={12} lg={6}>
          <Button
            color={'warning'}
            disabled={
              searchHostKey === undefined || searchHostKey === 'github.com'
            }
            onClick={() => {
              if (searchHostKey !== undefined) {
                confirm(`Delete ${searchHostKey}?`).then((ans) => {
                  if (ans) {
                    updateMegaSettings(async (settingsDraft) => {
                      delete settingsDraft.searchHosts[searchHostKey];
                    });
                    nav(locations.settings.link);
                  }
                });
              }
            }}
          >
            Delete search host
          </Button>
        </Grid>
        {searchHostKey !== undefined && settings !== undefined ? (
          <Grid item sm={12} lg={6}>
            <PasswordForm
              passwordPhrase={'Personal Access Token'}
              username={settings?.username}
              hostname={settings?.baseUrl}
            />
          </Grid>
        ) : null}
      </Grid>
      <hr />
      <div>
        <Button
          variant={'outlined'}
          color={'secondary'}
          onClick={() => nav(locations.settings.link)}
        >
          Back
        </Button>
      </div>
    </>
  );
};
