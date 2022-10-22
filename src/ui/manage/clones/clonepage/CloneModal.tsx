import React, {useState} from "react";
import {Box, Button, LinearProgress, Modal, Typography} from "@mui/material";
import {SearchHit} from "../../../search/types";
import {useMegaSettings} from "../../../../hooks/useMegaSettings";
import {modalStyle} from "../../../modal/megaModal";
import {clone} from "../../../../service/git/cloneWorker";
import {WorkProgress} from "../../../../service/types";
import {logInfo} from "../../../../hooks/logWrapper";

export type CloneModalPropsWrapper = {
  cloneModalPropsWrapper: CloneModalProps
}
export type CloneModalProps = {
    searchHits: SearchHit[]
    setSearchHits: (hits: SearchHit[]) => void,
    open: () => void,
    close: () => void,
    setOpen: (open: boolean) => void,
    isOpen: boolean,
}

export const useClonePageProps: () => CloneModalPropsWrapper = () => {
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const [isOpen, setOpen] = useState(false)
  return {
    cloneModalPropsWrapper: {
      searchHits,
      setSearchHits,
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
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const settings = useMegaSettings()
  const [progress, setProgress] = useState<WorkProgress | null>(null)
  const normalise = (value: number) => ((value) * 100) / (cloneModalPropsWrapper.searchHits.length);
  const close = () => {
    cloneModalPropsWrapper.setOpen(false)
    setRunning(false)
    setDone(false)
    setProgress(null)
  };

  return <Modal open={cloneModalPropsWrapper.isOpen} onClose={close}>
    <Box sx={modalStyle}>
      {!progress && <Typography>Clone {cloneModalPropsWrapper.searchHits.length} things into {settings.clonePath}?</Typography>}

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
              clone(cloneModalPropsWrapper.searchHits, "SSH", settings, (progress) => {
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
      </p>
    </Box>
  </Modal>
};
