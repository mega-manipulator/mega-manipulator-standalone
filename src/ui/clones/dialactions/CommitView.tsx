import { useCallback, useContext, useState } from 'react';
import { Alert, FormControl, FormHelperText, Typography } from '@mui/material';
import { gitCommit } from '../../../service/file/gitCommit';
import { MegaContext } from '../../../hooks/MegaContext';
import { ProgressReporter } from '../../../service/types';
import { MemorableTextField } from '../../components/MemorableTextField';
import {
  GenericSpeedDialActionProps,
  useGenericSpeedDialActionProps,
} from '../../components/speeddial/GenericSpeedDialAction';
import gitCommitImage from '../../../assets/git-commit.svg';

export function useCommitView(): GenericSpeedDialActionProps {
  const {
    clones: { selected },
    settings,
  } = useContext(MegaContext);

  const [commitMessage, setCommitMessage] = useState('');
  const trigger = useCallback(
    async (progress: ProgressReporter) =>
      await gitCommit({
        hits: selected,
        settings,
        commitMessage,
        sourceString: `Commit to ${selected.length} repos`,
        workResultKind: 'gitCommit',
        progress,
      }),
    [selected, settings, commitMessage]
  );

  return useGenericSpeedDialActionProps(
    'Commit changes',
    selected.length === 0,
    <img width={24} height={24} src={gitCommitImage} />,
    selected.length === 0 ? (
      <Alert color={'warning'} variant={'outlined'}>
        No Clones selected
      </Alert>
    ) : (
      <>
        <Typography variant={'h4'}>Commit staged changes</Typography>
        <div>
          <FormControl fullWidth>
            <FormHelperText>Commit message</FormHelperText>
            <MemorableTextField
              textProps={{
                minRows: 5,
                fullWidth: true,
                placeholder: 'Made some improvements to the flux capacitor',
              }}
              memProps={{
                megaFieldIdentifier: 'commitMessageField',
                value: commitMessage,
                valueChange: setCommitMessage,
              }}
            />
          </FormControl>
        </div>
      </>
    ),
    trigger,
    undefined
  );
}
