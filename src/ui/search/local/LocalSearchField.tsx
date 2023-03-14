import { useLocalSearchClient } from './LocalSearchClient';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, FormControl, FormHelperText, IconButton, LinearProgress, MenuItem, Select, Tooltip } from '@mui/material';
import { SearchFieldProps } from '../types';
import { error } from 'tauri-plugin-log-api';
import { asString } from '../../../hooks/logWrapper';
import { useCodeHostFilter, useOwnerFilter, useRepoFilter } from './useLocalHitFilters';
import { MegaContext } from '../../../hooks/MegaContext';
import { MemorableTextField } from '../../components/MemorableTextField';
import { MaxHitsField } from '../../components/MaxHitsField';

export interface LocalSearchFieldProps {
  readonly searchFieldProps: SearchFieldProps;
}

const programs = [
  'ag',
  //'grep',
  //'ripgrep',
];

export const LocalSearchField: React.FC<LocalSearchFieldProps> = ({ searchFieldProps }) => {
  const {
    settings,
    search: { setHits: setSearchHits },
  } = useContext(MegaContext);
  const localSearchClientWrapper = useLocalSearchClient(settings);
  const [program, setProgram] = useState<string>('ag');
  const [searchTerm, setSearchTerm] = useState<string>('foo');
  const [file, setFile] = useState<string>('.');
  const [searchError, setSearchError] = useState<string>();
  useEffect(() => {
    searchFieldProps?.setState(localSearchClientWrapper ? 'ready' : 'loading');
  }, [localSearchClientWrapper]);

  const [codeHost, setCodeHost] = useState<string>('*');
  const [owner, setOwner] = useState<string>('*');
  const [repo, setRepo] = useState<string>('*');
  const codeHosts = useCodeHostFilter(settings);
  const owners = useOwnerFilter(settings, codeHost);
  const repos = useRepoFilter(settings, codeHost, owner);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  }>();
  const currentSearchRef: React.MutableRefObject<number> = useRef<number>(0);

  const search = useCallback(
    (searchTerm: string) => {
      searchFieldProps?.setState('searching');
      setSearchHits([]);
      setSearchError(undefined);
      const fileRef = file.length === 0 ? '.' : file;
      currentSearchRef.current = new Date().getTime();
      localSearchClientWrapper.client
        ?.searchCode(program, searchTerm, fileRef, searchFieldProps.max, codeHost, owner, repo, currentSearchRef, (current, total) =>
          setProgress({
            current,
            total,
          })
        )
        .then((hits) => setSearchHits(hits))
        .catch((err) => {
          error(`Failed searching due to '${asString(err)}'`);
          setSearchError(asString(err, 2));
        })
        .finally(() => searchFieldProps?.setState('ready'));
    },
    [searchFieldProps, setSearchHits, localSearchClientWrapper.client, program, file, codeHost, owner, repo]
  );

  if (!settings) {
    return <CircularProgress />;
  }
  return (
    <>
      <FormControl>
        <FormHelperText>Code Host</FormHelperText>
        <Select value={codeHost} onChange={(p) => setCodeHost(p.target.value)}>
          {['*', ...(codeHosts ?? [])].map((p, i) => (
            <MenuItem key={i} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormHelperText>Owner</FormHelperText>
        <Select value={owner} onChange={(p) => setOwner(p.target.value)}>
          {['*', ...(owners ?? [])].map((p, i) => (
            <MenuItem key={i} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormHelperText>Repo</FormHelperText>
        <Select value={repo} onChange={(p) => setRepo(p.target.value)}>
          {['*', ...(repos ?? [])].map((p, i) => (
            <MenuItem key={i} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormHelperText>Program</FormHelperText>
        <Select value={program} onChange={(p) => setProgram(p.target.value)}>
          {programs.map((p, i) => (
            <MenuItem key={i} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl style={{ width: `${Math.max(10, file.length * 0.5)}em` }}>
        <FormHelperText>Search Term</FormHelperText>
        <MemorableTextField
          memProps={{
            value: searchTerm,
            valueChange: setSearchTerm,
            maxMemory: 25,
            saveOnEnter: true,
            enterAction: search,
            megaFieldIdentifier: 'localSearchTermField',
          }}
        />
      </FormControl>
      <FormControl style={{ width: `${Math.max(10, file.length * 0.5)}em` }}>
        <FormHelperText>File Pattern</FormHelperText>
        <MemorableTextField
          memProps={{
            value: file,
            valueChange: setFile,
            maxMemory: 25,
            saveOnEnter: true,
            enterAction: search,
            megaFieldIdentifier: 'localSearchFileField',
          }}
        />
      </FormControl>
      <MaxHitsField value={searchFieldProps.max} setValue={searchFieldProps.setMax} />
      {searchError && (
        <Tooltip title={<pre>{searchError}</pre>}>
          <Alert variant={'outlined'} color={'error'}>
            Something went weong here 😱
          </Alert>
        </Tooltip>
      )}

      {progress !== undefined && (
        <div>
          <Box sx={{ paddingTop: 1, width: '100%' }}>
            {searchFieldProps?.state === 'searching' && currentSearchRef.current !== 0 && (
              <Tooltip title={'Cancel search'}>
                <IconButton
                  onClick={() => {
                    currentSearchRef.current = 0;
                  }}
                >
                  x
                </IconButton>
              </Tooltip>
            )}
            <LinearProgress title={'progress'} color={'primary'} value={(progress.current / progress.total) * 100} variant={'determinate'} /> {progress.current}/{progress.total}
          </Box>
        </div>
      )}

      <Button disabled={searchFieldProps?.state !== 'ready'} variant={'contained'} color={'primary'} onClick={() => search(searchTerm)}>
        Search
      </Button>
    </>
  );
};
