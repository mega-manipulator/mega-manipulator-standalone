import React, {useEffect, useState} from "react";
import {Alert, Box, Button, LinearProgress, Modal, TextField, Typography} from "@mui/material";
import {SearchHit} from "../../../search/types";
import {useMegaSettings} from "../../../../hooks/useMegaSettings";
import {modalStyle} from "../../../modal/megaModal";
import {clone} from "../../../../service/git/cloneWorker";
import {WorkProgress} from "../../../../service/types";
import {asString, logError, logInfo} from "../../../../hooks/logWrapper";
import {useNavigate} from "react-router-dom";
import {locations} from "../../../route/locations";

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
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [workRef, setWorkRef] = useState<number | null>(null)
  const settings = useMegaSettings()
  const [progress, setProgress] = useState<WorkProgress | null>(null)
  const [branch, setBranch] = useState('')
  useEffect(() => {
    setBranch('batch_'+(new Date().toISOString().replaceAll(' ', '_')))
  },[])
  const normalise = (value: number) => ((value) * 100) / (cloneModalPropsWrapper.searchHits.length);
  const close = () => {
    cloneModalPropsWrapper.setOpen(false)
    setRunning(false)
    setDone(false)
    setProgress(null)
    setWorkRef(null)
    setErr(null)
  };

  return <Modal open={cloneModalPropsWrapper.isOpen} onClose={close}>
    <Box sx={modalStyle}>
      {!running && !done &&
          <>
              <Typography>Clone {cloneModalPropsWrapper.searchHits.length} things
                  into {settings.clonePath}?</Typography>
              <TextField variant={"filled"} label={'branch name'} value={branch} onChange={(event) => setBranch(event.target.value)}/>
          </>
      }

      {progress && <>
          <Box sx={{width: '100%'}}>
              <LinearProgress
                  variant="determinate"
                  value={progress ? normalise(progress.done) : 0}/>{progress?.done ?? 0}/{cloneModalPropsWrapper.searchHits.length} done.</Box>
        {progress?.breakdown && Object.keys(progress?.breakdown).map((k) => <>{k}: {progress.breakdown[k]}</>)}
      </>}
      <p>
        {!running && !done && <Button
            disabled={running || done}
            onClick={() => {
              logInfo('Start Cloning')
              setRunning(true)
              clone(
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
                  logError('Failed cloning' + asString(e));
                  setErr(asString(e))
                })
                .then(_ => {
                  setRunning(false)
                  setDone(true)
                  logInfo('Done cloning')
                });
            }}
        >Start clone</Button>}
        {(done || !running) && <Button disabled={running} onClick={close}>Close</Button>}
        {done && workRef && <Button onClick={() => nav(`${locations.result.link}/${workRef}`)}>Show result</Button>}
        {err && <Alert variant={"filled"} color={"error"}>err</Alert>}
      </p>
    </Box>
  </Modal>
};
