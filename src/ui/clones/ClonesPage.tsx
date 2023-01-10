import { IconButton, Tooltip, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { useDeleteMenuItem } from './dialactions/DeleteMenuItem';
import { MegaContext } from '../../hooks/MegaContext';
import {
  useOpenProjectsMenuItem,
  useOpenWorkdirMenuItem,
} from './dialactions/OpenProjectsMenuItem';
import ReplayIcon from '@mui/icons-material/Replay';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { openDirs } from '../../service/file/scriptFile';
import { ClonesTable, useClonesTableProps } from './ClonesTable';
import {
  GenericSpeedDialActionProps,
  GenericSpeedDialModal,
} from '../components/speeddial/GenericSpeedDialAction';
import { useCreatePullRequestView } from './dialactions/CreatePullRequestView';
import { useMakeChangesWizard } from './dialactions/MakeChangesWizard';
import { useCommitView } from './dialactions/CommitView';
import { useExecuteScriptedChangeMenuItem } from './dialactions/ExecuteScriptedChangeMenuItem';
import { usePushView } from './dialactions/PushView';
import { useStageView } from './dialactions/StageView';
import { GenericSpeedDial } from '../components/speeddial/GenericSpeedDial';

export const ClonesPage: React.FC = () => {
  const { os, settings } = useContext(MegaContext);

  const tableProps = useClonesTableProps();
  const items: GenericSpeedDialActionProps[] = [
    useMakeChangesWizard(),
    useCreatePullRequestView(),
    useCommitView(),
    useDeleteMenuItem(tableProps.reload),
    useExecuteScriptedChangeMenuItem(),
    useOpenProjectsMenuItem(),
    useOpenWorkdirMenuItem(),
    usePushView(),
    useStageView(),
  ];

  return (
    <>
      <Typography variant={'h4'}>Clones</Typography>
      {items.map((item, idx) => (
        <GenericSpeedDialModal key={idx} {...item} />
      ))}
      <div>
        WorkDir: {settings.clonePath}{' '}
        <Tooltip title={'Open work dir in editor application'}>
          <IconButton
            onClick={() => openDirs(os, settings, [settings.clonePath])}
          >
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
      </div>
      <Tooltip title={'Reload repos'}>
        <IconButton onClick={tableProps.reload}>
          <ReplayIcon />
        </IconButton>
      </Tooltip>
      <ClonesTable {...tableProps} />

      {items.map((item, idx) => (
        <GenericSpeedDialModal key={idx} {...item} />
      ))}
      <GenericSpeedDial items={items} />
    </>
  );
};
