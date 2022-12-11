import React, {useCallback, useEffect, useState} from "react";
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
  action: (progressCallback: (current: number, total: number) => void) => Promise<SimpleGitActionReturn>,
  isModalOpen: boolean,
  setIsModalOpen: (isModalOpen: boolean) => void,
  state: 'ready' | 'running' | 'done',
  setState: (state: 'ready' | 'running' | 'done') => void,
}

export function useGenericSpeedDialActionProps(
  tooltipTitle: string,
  disabled: boolean,
  icon: React.ReactNode,
  description: JSX.Element,
  action: (progressCallback: (current: number, total: number) => void) => Promise<SimpleGitActionReturn>,
): GenericSpeedDialActionProps {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, setState] = useState<'ready' | 'running' | 'done'>('ready');
  return {
    tooltipTitle,
    disabled,
    icon,
    description,
    action,
    isModalOpen,
    setIsModalOpen,
    state,
    setState,
  }
}

export const GenericSpeedDialModal: React.FC<GenericSpeedDialActionProps> = (
  {
    disabled,
    action,
    description,
    isModalOpen,
    setIsModalOpen,
    state,
    setState
  }: GenericSpeedDialActionProps
) => {
  const nav = useNavigate()
  const [err, setErr] = useState<string>();
  const [progress, setProgress] = useState<number>();
  const [workRef, setWorkRef] = useState<number>();
  const [workStatus, setWorkStatus] = useState<WorkResultStatus>();
  useEffect(() => {
    if (workRef) {
      getResultFromStorage(`${workRef}`).then((result) => {
        setWorkStatus(result?.status);
      })
    } else {
      setWorkStatus("failed");
    }
  }, [workRef]);
  useEffect(() => {
    if (disabled) {
      setIsModalOpen(false)
    }
  }, [disabled, setIsModalOpen]);
  useEffect(() => {
    setState('ready')
    setErr(undefined)
    setWorkRef(undefined)
    setProgress(undefined)
    setWorkStatus(undefined)
  }, [isModalOpen, setState]);


  const progressCallback = useCallback((current: number, total: number) => {
    setProgress((100.0 * current) / total)
  }, []);

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
        >Cancel</Button>
        <Button
          variant={"contained"}
          color={"warning"}
          disabled={state !== "ready"}
          onClick={() => {
            setState("running")
            action(progressCallback)
              .then((result) => setWorkRef(result.time))
              .catch((e) => setErr(asString(e)))
              .finally(() => setState("done"))
          }}
        >Execute</Button>
      </ButtonRow>
    </Box>
  </Modal>
}
