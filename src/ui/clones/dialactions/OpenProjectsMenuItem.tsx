import {useContext} from "react";
import {MegaContext} from "../../../hooks/MegaContext";
import {openDirs} from "../../../service/file/scriptFile";
import {
  GenericSpeedDialActionProps,
  useGenericSpeedDialActionProps
} from "../../components/speeddial/GenericSpeedDialAction";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export function useOpenProjectsMenuItem(): GenericSpeedDialActionProps {
  const {clones: {selected}, settings} = useContext(MegaContext);
  return useGenericSpeedDialActionProps(
    'Open selected with EditorApplication',
    selected.length === 0,
    <OpenInNewIcon fontSize={'small'}/>,
    <>{`Really open all (${selected.length}) selected projects, at once in ${settings.editorApplication}? Each in a new separate window.`}</>,
    async () => openDirs(settings, selected).then(() => ({time: 0}))
  )
}

export function useOpenWorkdirMenuItem(): GenericSpeedDialActionProps {
  const {clones: {paths}, settings} = useContext(MegaContext);
  return useGenericSpeedDialActionProps(
    'Open entire workdir with EditorApplication',
    false,
    <OpenInNewIcon fontSize={'large'}/>,
    <>{`Really open entire workdir, with ${paths.length} projects, at once in ${settings.editorApplication}? In a single window.`}</>,
    async () => openDirs(settings, [settings.clonePath]).then(() => ({time: 0}))
  )
}

