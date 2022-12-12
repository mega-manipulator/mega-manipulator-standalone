import React, {useCallback, useState} from "react";
import {Alert, Box, Button, LinearProgress, Modal, Tooltip, Typography} from "@mui/material";
import {modalStyle} from "../../modal/megaModal";
import {ButtonRow} from "../../components/ButtonRow";
import {SimpleGitActionReturn} from "../../../service/file/simpleActionWithResult";
import {WorkResultStatus} from "../../../service/types";
import {getResultFromStorage} from "../../../service/work/workLog";
import {asString} from "../../../hooks/logWrapper";
import {useNavigate} from "react-router-dom";
import {locations} from "../../route/locations";

export type GenericSpeedDialActionProps = {
  tooltipTitle: string,
  disabled: boolean,
  icon: React.ReactNode,
  description: JSX.Element,
  action?: (progressCallback: (current: number, total: number) => void) => Promise<SimpleGitActionReturn>,
  isModalOpen: boolean,
  setIsModalOpen: (isModalOpen: boolean) => void,
  state: 'ready' | 'running' | 'done',
  setState: (state: 'ready' | 'running' | 'done') => void,
  err: string | undefined,
  setErr: (err: string | undefined) => void,
  progress: number | undefined,
  setProgress: (progress: number | undefined) => void,
  workRef: number | undefined,
  setWorkRef: (workRef: number | undefined) => void,
  workStatus: WorkResultStatus | undefined,
  setWorkStatus: (workStatus: WorkResultStatus | undefined) => void,
}

export function useGenericSpeedDialActionProps(
  tooltipTitle: string,
  disabled: boolean,
  icon: React.ReactNode,
  description: JSX.Element,
  action: (progressCallback: (current: number, total: number) => void) => Promise<SimpleGitActionReturn>,
): GenericSpeedDialActionProps {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [err, setErr] = useState<string>();
  const [progress, setProgress] = useState<number>();
  const [workRef, setWorkRef] = useState<number>();
  const [workStatus, setWorkStatus] = useState<WorkResultStatus>();
  const setModalIsOpenProxy = useCallback((open: boolean) => {
    if (open) {
      setState('ready')
      setErr(undefined)
      setWorkRef(undefined)
      setProgress(undefined)
      setWorkStatus(undefined)
    }
    setIsModalOpen(open)
  }, [])
  const [state, setState] = useState<'ready' | 'running' | 'done'>('ready');
  return {
    tooltipTitle,
    disabled,
    icon,
    description,
    action,
    isModalOpen,
    setIsModalOpen: setModalIsOpenProxy,
    state,
    setState,

    err,
    setErr,
    progress,
    setProgress,
    workRef,
    setWorkRef,
    workStatus,
    setWorkStatus,
  }
}

export const GenericSpeedDialModal: React.FC<GenericSpeedDialActionProps> = (
  {
    action,
    description,
    isModalOpen,
    setIsModalOpen,
    state,
    setState,
    err,
    setErr,
    progress,
    setProgress,
    workRef,
    setWorkRef,
    workStatus,
    setWorkStatus,
  }: GenericSpeedDialActionProps
) => {
  const nav = useNavigate()
  const setStatusFromRef = useCallback((workRef: number) => {
    setWorkRef(workRef)
    if (workRef === 0) {
      setWorkStatus("unknown")
    } else if (workRef) {
      getResultFromStorage(`${workRef}`).then((result) => {
        setWorkStatus(result?.status);
      })
    } else {
      setWorkStatus("failed");
    }
  }, [setWorkRef, setWorkStatus])

  const progressCallback = useCallback((current: number, total: number) => {
    setProgress((100.0 * current) / total)
  }, [setProgress]);

  return <Modal
    onClose={() => state !== 'running' && setIsModalOpen(false)}
    open={isModalOpen}
  >
    <Box sx={modalStyle}>
      {/* Alerts */}
      {err && <div><Alert color={"warning"} variant={"filled"}>{err}</Alert></div>}
      {workRef && <div>
          <Tooltip title={'Click to show result'}>
              <Alert
                  color={workStatus === "ok" ? "success" : "warning"}
                  variant={"filled"}
                  onClick={() => nav(`${locations.result.link}/${workRef}`)}
              >Work done</Alert>
          </Tooltip>
      </div>}
      {progress && <div>
          <Box sx={{width: '100%'}}>
              <LinearProgress variant={"determinate"} value={progress}/>
          </Box>
          <Typography variant="body2" color="text.secondary">{`${Math.round(progress)}%`}</Typography>
      </div>}

      {/* Description */}
      <div>
        {description}
      </div>
      {/* Buttons */}
      <ButtonRow>
        <Button
          variant={"outlined"}
          color={"secondary"}
          disabled={state === "running"}
          onClick={() => state !== "running" && setIsModalOpen(false)}
        >Close</Button>
        {action && <Button
            variant={"contained"}
            color={"warning"}
            disabled={state !== "ready"}
            onClick={() => {
              setState("running")
              action(progressCallback)
                .then((result) => setStatusFromRef(result.time))
                .catch((e) => setErr(asString(e)))
                .finally(() => setState("done"))
            }}
        >Execute</Button>}
      </ButtonRow>
    </Box>
  </Modal>
}
