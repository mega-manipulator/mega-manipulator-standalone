import {CircularProgress, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {listClones} from "../../service/file/cloneDir";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {MegaSettingsType} from "../../hooks/MegaContext";

export const ClonesPage: React.FC = () => {
  const settings: MegaSettingsType | null = useMegaSettings()
  const [clones, setClones] = useState<string[]>([])
  const [state, setState] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    if (settings === null) {
      setState('loading')
    } else {
      (async () => {
        setClones(await listClones(settings));
        setState('ready')
      })()
    }
  }, [settings])
  return <>
    <Typography variant={'h4'}>Clones</Typography>
    {state === 'loading' && <CircularProgress/>}
    {state === 'ready' && <>
        Clones: ({clones.length})<br/>
        <ul>
          {clones.map(c => <li>{c}</li>)}
        </ul>
    </>
    }
  </>
}
