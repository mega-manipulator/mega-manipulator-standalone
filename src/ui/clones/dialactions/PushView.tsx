import { useCallback, useContext, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import { MegaContext } from '../../../hooks/MegaContext';
import { gitPush } from '../../../service/file/gitCommit';
import { ProgressReporter } from '../../../service/types';
import { GenericSpeedDialActionProps, useGenericSpeedDialActionProps } from '../../components/speeddial/GenericSpeedDialAction';
import BackupIcon from '@mui/icons-material/Backup';

export function usePushView(): GenericSpeedDialActionProps {
  const {
    settings,
    clones: { selected },
  } = useContext(MegaContext);
  const [used, setUsed] = useState(false);

  const trigger = useCallback(
    async (progress: ProgressReporter) => {
      if (!used) {
        setUsed(true);
        return await gitPush({
          hits: selected,
          sourceString: `git push ${selected.length} repos`,
          settings,
          workResultKind: 'gitPush',
          progress,
        });
      } else {
        return { time: 0 };
      }
    },
    [selected, settings, used]
  );
  return useGenericSpeedDialActionProps(
    'Push changes',
    selected.length === 0 && !used,
    <BackupIcon />,
    selected.length === 0 ? (
      <Alert color={'warning'} variant={'outlined'}>
        No Clones selected
      </Alert>
    ) : (
      <Typography variant={'h4'}>Push commits to origin</Typography>
    ),
    trigger,
    undefined
  );
}
