import { useContext } from 'react';
import { MegaContext } from '../../../hooks/MegaContext';
import { openDirs } from '../../../service/file/scriptFile';
import { GenericSpeedDialActionProps, useGenericSpeedDialActionProps } from '../../components/speeddial/GenericSpeedDialAction';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Alert } from '@mui/material';
import { MegaSettingsType } from '../../../hooks/settings';
import { OsType } from '@tauri-apps/api/os';

function openAppHumanReadable(os: OsType, settings: MegaSettingsType): string {
  if (settings.useSpecificEditorApplication && os === 'Darwin' && settings.editorApplication) {
    return settings.editorApplication;
  } else {
    switch (os) {
      case 'Darwin':
        return 'Finder';
      case 'Windows_NT':
        return 'Windows File Explorer';
      case 'Linux':
        return 'File Explorer';
    }
  }
}

export function useOpenProjectsMenuItem(): GenericSpeedDialActionProps {
  const {
    os,
    clones: { selected },
    settings,
  } = useContext(MegaContext);
  return useGenericSpeedDialActionProps(
    'Open selected with EditorApplication',
    selected.length === 0,
    <OpenInNewIcon fontSize={'small'} />,
    selected.length === 0 ? (
      <Alert color={'warning'} variant={'outlined'}>
        No Clones selected
      </Alert>
    ) : (
      <>{`Really open all (${selected.length}) selected projects, at once in ${openAppHumanReadable(os, settings)}? Each in a new separate window.`}</>
    ),
    async () => openDirs(os, settings, selected).then(() => ({ time: 0 }))
  );
}

export function useOpenWorkdirMenuItem(): GenericSpeedDialActionProps {
  const {
    os,
    clones: { paths },
    settings,
  } = useContext(MegaContext);
  return useGenericSpeedDialActionProps('Open entire workdir with EditorApplication', false, <OpenInNewIcon fontSize={'large'} />, <>{`Really open entire workdir, with ${paths.length} projects, at once in ${settings.editorApplication}? In a single window.`}</>, async () =>
    openDirs(os, settings, [settings.clonePath]).then(() => ({ time: 0 }))
  );
}
