import { useWizardComponent } from '../../wizard/WizardComponent';
import { useCreatePullRequestView } from './CreatePullRequestView';
import { GenericSpeedDialActionProps } from '../../components/speeddial/GenericSpeedDialAction';
import { useExecuteScriptedChangeMenuItem } from './ExecuteScriptedChangeMenuItem';
import { useStageView } from './StageView';
import { useCommitView } from './CommitView';
import { usePushView } from './PushView';
import { MegaContext } from '../../../hooks/MegaContext';
import { useContext } from 'react';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export function useMakeChangesWizard(): GenericSpeedDialActionProps {
  const {
    clones: { selected },
  } = useContext(MegaContext);
  const items: GenericSpeedDialActionProps[] = [
    useStageView(),
    useExecuteScriptedChangeMenuItem(),
    useCommitView(),
    usePushView(),
    useCreatePullRequestView(),
  ];

  return useWizardComponent(
    'Wizard Changes',
    selected.length === 0,
    <AutoFixHighIcon />,
    items
  );
}
