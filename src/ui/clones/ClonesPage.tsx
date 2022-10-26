import {CircularProgress, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {analyzeRepoForBadStates, listClones, RepoBadStatesReport} from "../../service/file/cloneDir";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {asString} from "../../hooks/logWrapper";

export const ClonesPage: React.FC = () => {
  const settings: MegaSettingsType | null = useMegaSettings()
  const [state, setState] = useState<'loading' | 'ready'>('loading')

  const [repoStates, setRepoStates] = useState<RepoBadStatesReport[]>([])
  useEffect(() => {
    if (settings === null) {
      setState('loading')
    } else {
      (async () => {
        const paths = await listClones(settings);
        const analysis = await Promise.all(paths.map((path) =>analyzeRepoForBadStates(settings, path)))
        setRepoStates(analysis)
        setState('ready')
      })()
    }
  }, [settings])

  return <>
    <Typography variant={'h4'}>Clones</Typography>
    {state === 'loading' && <CircularProgress/>}
    {state === 'ready' && <>
        Clones: ({repoStates.length})<br/>
        <ul>
          {repoStates.map(c => <li>{asString(c)} </li>)}
        </ul>
    </>
    }
  </>
}
