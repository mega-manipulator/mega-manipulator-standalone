import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ResetAllSettings } from './ResetAllSettings';
import { usePassword } from '../../hooks/usePassword';

import { Button, Checkbox, CircularProgress, FormControl, FormHelperText, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { locations } from '../route/locations';
import { createDefault, MegaSettingsType } from '../../hooks/settings';
import { error, info } from 'tauri-plugin-log-api';
import { NewSearchHostButton } from './NewSearchHostButton';
import { MegaContext } from '../../hooks/MegaContext';
import { MemorableTextField } from '../components/MemorableTextField';

type SearchHostRowProps = {
  searchHostKey: string;
  settings: MegaSettingsType;
};

function rowStyle(args: { username: string | undefined; baseUrl: string | undefined; password: string | null }): React.CSSProperties {
  const baseCss: React.CSSProperties = {
    cursor: 'pointer',
  };
  if (args.username === undefined) {
    return {
      ...baseCss,
      background: 'orange',
    };
  }
  if (args.baseUrl === undefined) {
    return {
      ...baseCss,
      background: 'red',
    };
  }
  if (!args.password) {
    return {
      ...baseCss,
      background: 'orange',
    };
  }
  return baseCss;
}

const SearchHostRow: React.FC<SearchHostRowProps> = ({ settings, searchHostKey }) => {
  const nav = useNavigate();
  const h = settings.searchHosts[searchHostKey];
  const userName = useMemo(() => h?.github?.username ?? h?.sourceGraph?.username, [h]);
  const baseUrl = useMemo(() => h?.github?.baseUrl ?? h?.sourceGraph?.baseUrl, [h]);
  const [password] = usePassword(userName, baseUrl);
  if (h.type === 'SOURCEGRAPH') {
    return (
      <TableRow
        style={rowStyle({
          username: h.sourceGraph?.username,
          baseUrl: h?.sourceGraph?.baseUrl,
          password,
        })}
        onClick={() => {
          info('Nav > Edit Search host ' + locations.settings.search.sourcegraph.link);
          nav(`${locations.settings.search.sourcegraph.link}/${searchHostKey}`);
        }}
      >
        <TableCell>{searchHostKey}</TableCell>
        <TableCell>{h.type}</TableCell>
        <TableCell>{h.sourceGraph?.username}</TableCell>
      </TableRow>
    );
  } else if (h.type === 'GITHUB') {
    return (
      <TableRow
        style={rowStyle({
          username: h.github?.username,
          baseUrl: h?.github?.baseUrl,
          password,
        })}
        onClick={() => {
          info('Nav > Edit Search host ' + locations.settings.search.github.link);
          nav(`${locations.settings.search.github.link}/${searchHostKey}`);
        }}
      >
        <TableCell>{searchHostKey}</TableCell>
        <TableCell>{h.type} </TableCell>
        <TableCell>{h.github?.username} </TableCell>
      </TableRow>
    );
  } else {
    error(`Unable to determine class of search host ${searchHostKey} :: ${JSON.stringify(h)}`);
    return null;
  }
};

type CodeHostRowProps = {
  codeHostKey: string;
  settings: MegaSettingsType;
};

const CodeHostRow: React.FC<CodeHostRowProps> = ({ settings, codeHostKey }) => {
  const h = settings.codeHosts[codeHostKey];
  const userName = useMemo(() => h?.github?.username, [h]);
  const baseUrl = useMemo(() => h?.github?.baseUrl, [h]);
  const [password] = usePassword(userName, baseUrl);
  const nav = useNavigate();
  if (h.type === 'GITHUB') {
    return (
      <TableRow
        style={rowStyle({
          username: h.github?.username,
          baseUrl: h?.github?.baseUrl,
          password,
        })}
        onClick={() => nav(`${locations.settings.code.github.link}/${codeHostKey}`)}
      >
        <TableCell>{codeHostKey} </TableCell>
        <TableCell>{h.type} </TableCell>
        <TableCell>{h.github?.username}</TableCell>
      </TableRow>
    );
  } else {
    error(`Unable to determine class of code host ${codeHostKey} :: ${JSON.stringify(h)}`);
    return null;
  }
};

export const SettingsPage = () => {
  const { os, settings: megaSettings, updateSettings: updateMegaSettings } = useContext(MegaContext);
  const nav = useNavigate();

  const [keepLocalRepos, setKeepLocalRepos] = useState<string>();
  const [clonePath, setClonePath] = useState<string>();
  const [editorApplicationPath, setEditorApplicationPath] = useState<string>('');
  const [useSpecificEditorApplication, setUseSpecificEditorApplication] = useState(false);
  const [reload, setReload] = useState(0);

  const [state, setState] = useState<'loading' | 'ready'>('loading');
  useEffect(() => {
    if (megaSettings !== null) {
      setKeepLocalRepos(megaSettings.keepLocalReposPath);
      setClonePath(megaSettings.clonePath);
      setState('ready');
      setEditorApplicationPath(megaSettings.editorApplication);
      setUseSpecificEditorApplication(megaSettings.useSpecificEditorApplication);
    } else {
      setKeepLocalRepos(undefined);
      setClonePath(undefined);
      setEditorApplicationPath('');
      setUseSpecificEditorApplication(false);
      setState('loading');
    }
  }, [megaSettings, reload]);

  const dirty: string[] = useMemo(() => {
    const found: string[] = [];
    if (keepLocalRepos !== megaSettings.keepLocalReposPath) {
      found.push('Keep path');
    }
    if (clonePath !== megaSettings.clonePath) {
      found.push('Clone path');
    }
    if (editorApplicationPath !== megaSettings.editorApplication) {
      found.push('Editor application');
    }
    if (useSpecificEditorApplication !== megaSettings.useSpecificEditorApplication) {
      found.push('Use editor app');
    }
    return found;
  }, [clonePath, editorApplicationPath, keepLocalRepos, megaSettings.clonePath, megaSettings.editorApplication, megaSettings.keepLocalReposPath, megaSettings.useSpecificEditorApplication, useSpecificEditorApplication]);
  const saveButtonText: string = useMemo(() => {
    switch (dirty.length) {
      case 0:
        return 'Nothing changed to save';
      case 1:
        return `Save changes to "${dirty[0]}"`;
      default:
        return `Save changes to ${dirty.length} changed values`;
    }
  }, [dirty]);

  if (state === 'loading') {
    return (
      <>
        <div>
          <CircularProgress />
        </div>
        <div>
          If this loading continues forever, it might be due to your saved settings being borked.
          <br />
          One way to fix this is by resetting the settings to default state.
          <br />
          Passwords will remain in your OS keystore ofc 😉
          <br />
          <Button
            color={'error'}
            variant={'outlined'}
            onClick={() => {
              createDefault().then(() => info('Settings wiped'));
            }}
          >
            Wipe settings
          </Button>
        </div>
      </>
    );
  }
  return (
    <>
      <span>
        <Typography variant={'h4'}>Settings</Typography>
      </span>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <FormHelperText>Keep Local Repos path</FormHelperText>
            <TextField id="keep-local-repos-path-text-field" fullWidth variant="outlined" value={keepLocalRepos} onChange={(event) => setKeepLocalRepos(event.target.value)} />
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <FormHelperText>Clone Repos path</FormHelperText>
            <TextField id="clone-repo-path-text-field" fullWidth variant={'outlined'} value={clonePath} onChange={(event) => setClonePath(event.target.value)} />
          </FormControl>
        </Grid>
        {os === 'Darwin' && (
          <>
            <Grid item xs={6} md={2}>
              <FormControl>
                <FormHelperText>Use editor to open files</FormHelperText>
                <Checkbox checked={useSpecificEditorApplication === true} onClick={() => setUseSpecificEditorApplication(!useSpecificEditorApplication)} />
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormHelperText>Editor Application path</FormHelperText>

                <MemorableTextField
                  memProps={{
                    megaFieldIdentifier: 'editorApplicationPath',
                    value: editorApplicationPath,
                    valueChange: setEditorApplicationPath,
                  }}
                  textProps={{
                    id: 'editorApplication-text-field',
                    fullWidth: true,
                    variant: 'outlined',
                  }}
                />
              </FormControl>
            </Grid>
          </>
        )}
        <Grid item xs={6}>
          <FormControl>
            <FormHelperText>{saveButtonText}</FormHelperText>
            <Button
              variant={'contained'}
              disabled={dirty.length === 0}
              onClick={() => {
                updateMegaSettings((draft) => {
                  if (clonePath) draft.clonePath = clonePath;
                  if (keepLocalRepos) draft.keepLocalReposPath = keepLocalRepos;
                  if (editorApplicationPath) draft.editorApplication = editorApplicationPath;
                  draft.useSpecificEditorApplication = useSpecificEditorApplication;
                });
                info('Updated settings');
              }}
            >
              Save settings
            </Button>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl>
            <FormHelperText>Reset</FormHelperText>
            <Button variant={'contained'} disabled={dirty.length === 0} onClick={() => setReload(reload + 1)}>
              Reset
            </Button>
          </FormControl>
        </Grid>
      </Grid>
      <div>&nbsp;</div>
      <hr />
      <div>&nbsp;</div>
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
              <TableBody>{megaSettings && Object.keys(megaSettings.searchHosts).map((k) => <SearchHostRow key={k} searchHostKey={k} settings={megaSettings} />)}</TableBody>
            </Table>
          </TableContainer>
          <NewSearchHostButton />
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
              <TableBody>{megaSettings && Object.keys(megaSettings.codeHosts).map((k, idx) => <CodeHostRow key={idx} codeHostKey={k} settings={megaSettings} />)}</TableBody>
            </Table>
          </TableContainer>
          <Button onClick={() => nav(locations.settings.code.github.link)} variant={'contained'}>
            Add new Code host
          </Button>
        </Grid>
      </Grid>
      <p>
        <ResetAllSettings />
      </p>
    </>
  );
};
