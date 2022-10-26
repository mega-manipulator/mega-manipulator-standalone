import React, {useEffect, useState} from "react";
import {Alert, Box, Button, CircularProgress, LinearProgress, Modal, TextField, Typography} from "@mui/material";
import {SearchHit} from "../../../search/types";
import {useMegaSettings} from "../../../../hooks/useMegaSettings";
import {modalStyle} from "../../../modal/megaModal";
import {clone} from "../../../../service/git/cloneWorker";
import {WorkProgress} from "../../../../service/types";
import {asString} from "../../../../hooks/logWrapper";
import {useNavigate} from "react-router-dom";
import {locations} from "../../../route/locations";
import {MegaSettingsType} from "../../../../hooks/MegaContext";
import {info, error} from "tauri-plugin-log-api";

export type CloneModalPropsWrapper = {
  cloneModalPropsWrapper: CloneModalProps
}
export type CloneModalProps = {
  searchHits: SearchHit[]
  setSearchHits: (hits: SearchHit[]) => void,
  sourceString: string,
  setSourceString: (sourceString: string) => void,
  open: () => void,
  close: () => void,
  setOpen: (open: boolean) => void,
  isOpen: boolean,
}

export const useCloneModalProps: () => CloneModalPropsWrapper = () => {
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const [isOpen, setOpen] = useState(false)
  const [sourceString, setSourceString] = useState('')
  return {
    cloneModalPropsWrapper: {
      searchHits, setSearchHits,
      sourceString, setSourceString,
      open: () => {
        setOpen(true)
      },
      close: () => {
        setOpen(false)
      },
      setOpen,
      isOpen,
    }
  }
}

export const CloneModal: React.FC<CloneModalPropsWrapper> = (
  {cloneModalPropsWrapper}: CloneModalPropsWrapper
) => {
  const nav = useNavigate()
  const [err, setErr] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'running' | 'done'>('loading')
  const [workRef, setWorkRef] = useState<number | null>(null)
  const settings: MegaSettingsType | null = useMegaSettings()
  const [progress, setProgress] = useState<WorkProgress | null>(null)
  const [branch, setBranch] = useState('')
  useEffect(() => {
    setBranch('batch_' + (new Date().toISOString().replaceAll(/[^a-zA-Z0-9-]/g, '_')))
  }, [])
  const normalise = (value: number) => ((value) * 100) / (cloneModalPropsWrapper.searchHits.length);
  const close = () => {
    cloneModalPropsWrapper.setOpen(false)
    if (settings === null) setState("loading"); else setState('ready');
    setProgress(null)
    setWorkRef(null)
    setErr(null)
  };
  useEffect(() => {
    if (settings === null) setState("loading"); else setState('ready');
  }, [settings])

  return <Modal open={cloneModalPropsWrapper.isOpen} onClose={close}>
    <Box sx={modalStyle}>
      {state === 'loading' && <CircularProgress/>}
      {state === 'ready' && <>
          <Typography>Clone {cloneModalPropsWrapper.searchHits.length} things into {settings?.clonePath}?</Typography>
          <TextField
              variant={"filled"}
              label={'branch name'}
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
          />
      </>}

      {(state === "running" || state === 'done') && <>
          <Box sx={{width: '100%'}}>
              <LinearProgress
                  variant="determinate"
                  value={progress ? normalise(progress.done) : 0}
              />{progress?.done ?? 0}/{cloneModalPropsWrapper.searchHits.length} done.
          </Box>
        {progress?.breakdown && Object.keys(progress?.breakdown)
          .map((k) => <>{k}: {progress.breakdown[k]},&nbsp;</>)
        }
      </>}
      <p>
        {state === 'ready' && <Button
            onClick={() => {
              info('Start Cloning')
              setState("running")
              settings !== null && clone(
                cloneModalPropsWrapper.searchHits,
                cloneModalPropsWrapper.sourceString,
                branch,
                "SSH",
                settings,
                (progress) => {
                  setProgress(progress)
                })
                .then((ref) => setWorkRef(ref))
                .catch(e => {
                  error('Failed cloning' + asString(e));
                  setErr(asString(e))
                })
                .then(_ => {
                  setState('done')
                  info('Done cloning')
                });
            }}
        >Start clone</Button>}
        {state !== "running" && <Button onClick={close}>Close</Button>}
        {state === 'done' && workRef &&
            <Button onClick={() => nav(`${locations.result.link}/${workRef}`)}>Show result</Button>}
        {err && <Alert variant={"filled"} color={"error"}>err</Alert>}
      </p>
    </Box>
  </Modal>
};
