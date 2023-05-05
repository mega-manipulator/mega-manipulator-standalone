import { GenericSpeedDialActionProps, useGenericSpeedDialActionProps } from '../../components/speeddial/GenericSpeedDialAction';
import { useContext } from 'react';
import { MegaContext } from '../../../hooks/MegaContext';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Alert } from '@mui/material';
import { pathToSearchHit } from '../../../service/file/cloneDir';
import { warn } from 'tauri-plugin-log-api';
import { open } from '@tauri-apps/api/shell';

export function useOpenRepoMenuItem(): GenericSpeedDialActionProps {
  const {
    clones: { selected },
    settings,
  } = useContext(MegaContext);
  return useGenericSpeedDialActionProps(
    'Open selected with browser',
    selected.length === 0,
    <OpenInNewIcon fontSize={'small'} />,
    selected.length === 0 ? (
      <Alert color={'warning'} variant={'outlined'}>
        No Clones selected
      </Alert>
    ) : (
      <>{`Really open all (${selected.length}) selected projects at once in browser? Each in a new separate tab.`}</>
    ),
    async () => {
      await Promise.all(
        selected.map(async (repoPath) => {
          const hit = await pathToSearchHit('local', repoPath);
          const baseUrl = settings.codeHosts[hit.codeHost]?.github?.baseHttpUrl;
          if (!baseUrl) {
            warn(`Failed resolving baseUrl for code host ${hit.codeHost}`);
            return;
          }
          await open(`${baseUrl}/${hit.owner}/${hit.repo}`);
        })
      );
      return { time: 0 };
    }
  );
}
