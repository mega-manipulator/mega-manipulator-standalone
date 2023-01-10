import React, { useContext, useEffect, useMemo, useState } from 'react';
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
import { GitHubCodeHostSettings } from '../../hooks/settings';

export const GitHubCodeHostSettingsPage: React.FC = () => {
  const { codeHostKey } = useParams();
  const { updateSettings: updateMegaSettings, settings: megaSettings } =
    useContext(MegaContext);
  const { codeHosts } = megaSettings;
  const codeHost = useMemo(
    () => (codeHostKey ? codeHosts[codeHostKey] : undefined),
    [codeHosts, codeHostKey]
  );
  const [codeHostKeyVal, setCodeHostKeyVal] = useState<string>('');
  const [codeHostVal, setCodeHostVal] = useState<GitHubCodeHostSettings>();
  useEffect(() => {
    setCodeHostVal(
      codeHost?.github ?? {
        baseUrl: 'https://api.github.com',
        cloneHost: 'github.com',
        hostType: 'CODE',
        username: 'jensim',
      }
    );
  }, [codeHost]);
  useEffect(() => {
    setCodeHostKeyVal(codeHostKey ?? '');
  }, [codeHostKey]);
  const [codeHostKeySame, setCodeHostKeySame] = useState(0);
  useEffect(() => {
    setCodeHostKeySame(
      Object.keys(megaSettings.codeHosts).filter((it) => it === codeHostKeyVal)
        .length
    );
  }, [codeHostKeyVal, megaSettings]);
  const [validationError, setValidationError] = useState<string>();
  useEffect(() => {
    const errors: string[] = [];
    if (codeHostKeyVal.length === 0)
      errors.push('Code host key cannot be empty');
    if (codeHostKey === undefined && codeHostKeySame > 0)
      errors.push('Code host key already defined');
    if (codeHostKey !== undefined && codeHostKeySame > 1)
      errors.push('Code host key already defined');
    if (codeHostKey !== undefined && codeHostKey !== codeHostKeyVal)
      errors.push('Code host key cannot be changed');
    if (codeHostVal?.username === undefined || codeHostVal.username.length < 1)
      errors.push('Username is undefined');
    if (codeHostVal?.baseUrl === undefined || codeHostVal.baseUrl.length < 1)
      errors.push('BaseURL is undefined');
    if (
      codeHostVal?.baseUrl !== undefined &&
      !codeHostVal.baseUrl.match(/^https*:\/\/.*[^/]$/)
    )
      errors.push('BaseURL is malformed');
    if (
      codeHostVal?.baseUrl !== undefined &&
      (codeHostVal.baseUrl.startsWith('https://github.com') ||
        codeHostVal.baseUrl.startsWith('http://github.com'))
    )
      errors.push('GitHub base url is https://api.github.com');
    if (
      codeHostVal?.baseUrl !== undefined &&
      (codeHostVal.baseUrl.startsWith('https://api.github.com') ||
        codeHostVal.baseUrl.startsWith('http://api.github.com')) &&
      codeHostVal.baseUrl !== 'https://api.github.com'
    )
      errors.push('GitHub base url is https://api.github.com');
    if (errors.length === 0) setValidationError(undefined);
    else setValidationError(errors.join(', '));
  }, [codeHostVal, codeHostKeyVal, codeHostKey, codeHostKeySame]);
  const header = useMemo(
    () =>
      `${
        codeHostKey === undefined ? 'Create' : `Edit ${codeHostKey}`
      } (GitHub Code Host)`,
    [codeHostKey]
  );
  const nav = useNavigate();

  return (
    <>
      {codeHostVal && (
        <>
          <Typography variant={'h4'}>{header}</Typography>
          <div>
            {codeHostKey && codeHostKey !== 'github.com' && (
              <Button
                color={'warning'}
                onClick={() => {
                  confirm('Delete?', codeHostKey).then((d) => {
                    if (d) {
                      warn('Deleting code host ' + codeHostKey);
                      updateMegaSettings(async (settingsDraft) => {
                        if (codeHostKey) {
                          delete settingsDraft.codeHosts[codeHostKey];
                        }
                      });
                      nav(locations.settings.link);
                    }
                  });
                }}
              >
                Delete
              </Button>
            )}
          </div>
          <Grid>
            <Grid item sm={12} lg={6}>
              <FormControl>
                <FormHelperText>Code Host Key</FormHelperText>
                <TextField
                  variant={'outlined'}
                  disabled={codeHostKey !== undefined}
                  placeholder="Code Host Key"
                  value={codeHostKeyVal}
                  onChange={(event) => setCodeHostKeyVal(event.target.value)}
                />
              </FormControl>
            </Grid>
            <Grid item sm={12} lg={6}>
              <FormControl>
                <FormHelperText>Username</FormHelperText>
                <TextField
                  variant={'outlined'}
                  placeholder="Username"
                  value={codeHostVal?.username}
                  onChange={(event) =>
                    setCodeHostVal({
                      ...codeHostVal,
                      username: event.target.value,
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
                  value={codeHostVal?.baseUrl}
                  onChange={(event) =>
                    setCodeHostVal({
                      ...codeHostVal,
                      baseUrl: event.target.value,
                    })
                  }
                />
              </FormControl>
            </Grid>
          </Grid>
          <Button
            variant={'contained'}
            color={'primary'}
            disabled={validationError !== undefined}
            onClick={() => {
              if (codeHostKey === undefined && validationError !== undefined) {
                // CREATE
                if (codeHostKeyVal.length > 0 && codeHostKeySame === 0) {
                  info('Creating new Code host config node');
                  updateMegaSettings(async (settingsDraft) => {
                    settingsDraft.codeHosts[codeHostKeyVal] = {
                      type: 'GITHUB',
                      github: codeHostVal,
                    };
                  });
                  nav(locations.settings.link);
                } else {
                  warn('Failed validation');
                }
              } else if (codeHostKeyVal.length > 0 && codeHostKeySame === 1) {
                // UPDATE
                info('Updating old Code host config node');
                updateMegaSettings(async (settingsDraft) => {
                  settingsDraft.codeHosts[codeHostKeyVal] = {
                    type: 'GITHUB',
                    github: codeHostVal,
                  };
                });
              }
            }}
          >
            {codeHostKey ? 'Update' : 'Create'}
          </Button>
          {validationError && (
            <Grid item sm={12} lg={6}>
              <Alert severity={'warning'} color={'warning'}>
                {validationError}
              </Alert>
            </Grid>
          )}
        </>
      )}
      <div>
        <Button
          variant={'outlined'}
          color={'secondary'}
          onClick={() => nav(locations.settings.link)}
        >
          Back to Settings
        </Button>
      </div>
    </>
  );
};
