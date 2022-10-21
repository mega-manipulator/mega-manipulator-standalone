import React, {ReactElement, useState} from "react";
import {Box, Button, LinearProgress, Modal, Typography} from "@mui/material";
import {SearchHit} from "../../../search/types";
import {useMegaSettings} from "../../../../hooks/useMegaSettings";
import {modalStyle} from "../../../modal/megaModal";
import {clone} from "../../../../service/git/cloneWorker";
import {WorkProgress} from "../../../../service/types";
import {logInfo} from "../../../../hooks/logWrapper";

export type ClonePageProps = {
  searchHits: SearchHit[]
}

export type CloneModalReturn = {
  Component: ReactElement,
  open: () => void,
  close: () => void,
}

export const CloneModal: (props: ClonePageProps) => CloneModalReturn = ({searchHits}: ClonePageProps) => {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [open, setOpen] = useState(false)
  const [cancel, setCancel] = useState(false)
  const settings = useMegaSettings()
  const [progress, setProgress] = useState<WorkProgress | null>(null)
  const normalise = (value: number) => ((value) * 100) / (searchHits.length);
  const close = () => {
    setOpen(false)
    setCancel(false)
    setRunning(false)
    setDone(false)
    setProgress(null)
  };

  const Component = <Modal open={open} onClose={close}>
    <Box sx={modalStyle}>
      {!progress && <Typography>Clone {searchHits.length} things into {settings.clonePath}?</Typography>}

      {progress && <>
          <Box sx={{width: '100%'}}><LinearProgress variant="determinate"
                                                    value={progress ? normalise(progress.done) : 0}/>{progress?.done ?? 0}/{searchHits.length} done.</Box>
        {progress?.breakdown && Object.keys(progress?.breakdown).map((k) => <>{k}: {progress.breakdown[k]}</>)}
      </>}
      <p>
        {!running && !done && <Button
            disabled={running || done}
            onClick={() => {
              logInfo('Start Cloning')
              setRunning(true)
              clone(searchHits, "SSH", cancel,(progress) => {
                setProgress(progress)
                //setForceUpdate(forceUpdate + 1)
              }).then(_ => {
                setRunning(false)
                setDone(true)
                logInfo('Done cloning')
              });
            }}
        >Start clone</Button>}
        {(done || !running) && <Button disabled={running} onClick={close}>Close</Button>}
        {done && <Button>Show result</Button>}
        {running && <Button onClick={()=>setCancel(true)}>Cancel</Button>}
      </p>
    </Box>
  </Modal>
  return {
    Component,
    close,
    open: () => setOpen(true),
  }
};
