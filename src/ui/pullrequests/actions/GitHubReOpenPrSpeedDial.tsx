import { useGenericSpeedDialActionProps } from '../../components/speeddial/GenericSpeedDialAction';
import { MegaContext } from '../../../hooks/MegaContext';
import { useCallback, useContext, useMemo, useState } from 'react';
import {
  Alert,
  FormControl,
  FormHelperText,
  Switch,
  Tooltip,
} from '@mui/material';
import { useGitHubCodeClient } from '../../search/github/useGitHubSearchClient';
import { open } from '@tauri-apps/api/shell';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { MemorableTextField } from '../../components/MemorableTextField';

export function useGitHubReOpenPrSpeedDial() {
  const {
    pullRequests: { selected },
  } = useContext(MegaContext);
  const { ghClient, clientInitError } = useGitHubCodeClient();
  const [doComment, setDoComment] = useState(false);
  const [reopenComment, setReopenComment] = useState('');
  const action = useCallback(
    async (progressCallback: (current: number, total: number) => void) => {
      progressCallback(0, selected.length);
      if (ghClient) {
        const result = await ghClient.reOpenPullRequests(
          {
            prs: selected,
            comment: doComment ? reopenComment : undefined,
          },
          (idx) => progressCallback(idx + 1, selected.length)
        );
        return { time: result.time };
      }
      return {
        time: 0,
      };
    },
    [selected, reopenComment, ghClient, doComment]
  );
  const droppedBranches = useMemo(
    () => selected.filter((s) => s !== undefined && s.head === undefined),
    [selected]
  );
  const openPrs = useMemo(
    () => selected.filter((s) => s !== undefined && s.state === 'OPEN'),
    [selected]
  );

  return useGenericSpeedDialActionProps(
    'Re-open selected Pull requests',
    selected.length === 0,
    <RotateRightIcon />,
    <>
      {droppedBranches.length !== 0 && (
        <Tooltip
          title={
            'Click me to open all with dropped branches in browser, to click the Restore Branch button'
          }
        >
          <Alert
            variant={'outlined'}
            color={'warning'}
            onClick={() => {
              droppedBranches.forEach((d) => open(d.htmlUrl));
            }}
          >
            Some of selected PRs have got their branches dropped already
          </Alert>
        </Tooltip>
      )}
      {openPrs.length !== 0 && (
        <Alert color={'warning'} variant={'outlined'}>
          {openPrs.length} of the selected PRs are already open 🤦
        </Alert>
      )}
      {clientInitError && (
        <Alert variant={'outlined'} color={'error'}>
          {clientInitError}
        </Alert>
      )}

      <div>
        <FormControl>
          <FormHelperText>Comment</FormHelperText>
          <Switch
            onClick={() => setDoComment(!doComment)}
            checked={doComment}
          />
        </FormControl>
      </div>
      {doComment && (
        <FormControl fullWidth>
          <FormHelperText>Re-open comment</FormHelperText>
          <MemorableTextField
            memProps={{
              megaFieldIdentifier: 'reOpenPrComment',
              value: reopenComment,
              valueChange: setReopenComment,
            }}
            textProps={{
              disabled: doComment,
            }}
          />
        </FormControl>
      )}
    </>,
    action
  );
}
