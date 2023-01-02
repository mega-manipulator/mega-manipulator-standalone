import React, {useCallback, useEffect, useState} from "react";
import {Box, Button, LinearProgress, ListItemButton, Modal, Typography} from "@mui/material";
import {modalStyle} from "../../modal/megaModal";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";
import {ButtonRow} from "../../components/ButtonRow";
import {ProgressReporter} from "../../../service/types";


type GenericMultiProjectMenuItemProps = {
  openButtonText: string;
  confirm: string | JSX.Element,
  action: (progress: ProgressReporter) => Promise<void>;
  closeAction?: () => void,
  runButtonText?: string,
  cancelButtonText?: string,
  closeButtonText?: string,
  isAvailable: () => Promise<boolean>;
};

export const GenericMultiProjectMenuItem: React.FC<GenericMultiProjectMenuItemProps> = (
  {
    openButtonText,
    confirm = `Really Run ${openButtonText}?`,
    runButtonText = 'Yea! 🧨',
    cancelButtonText = 'Cancel',
    closeButtonText = 'Close',
    action,
    closeAction = () => {
      return;
    },
    isAvailable,
  }
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<'ready' | 'running' | 'done'>('ready');
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    isAvailable().then((available) => setAvailable(available))
      .catch((e) => error(`Failed evaluating availability for '${openButtonText}' due to: ${asString(e)}`))
  }, [isAvailable, openButtonText]);
  const [progressTotal, setProgressTotal] = useState<number | null>(null);
  const [progressCurrent, setProgressCurrent] = useState<number | null>(null);
  const progressor: ProgressReporter = useCallback((current, total) => {
    setProgressCurrent(current)
    setProgressTotal(total)
  }, []);
  const close = useCallback(() => {
    if (state !== 'running') {
      setState('ready')
      setIsOpen(false)
      closeAction()
    }
  }, [state, closeAction]);


  return <>
    <ListItemButton disabled={!available} onClick={() => setIsOpen(true)}>{openButtonText}</ListItemButton>
    <Modal open={isOpen} onClose={close}>
      <Box sx={modalStyle}>
        {progressTotal && progressCurrent && <Box width={'100%'}>
            <LinearProgress value={progressCurrent / progressTotal * 100.0}/> {progressCurrent} / {progressTotal}
        </Box>}
        {typeof confirm === 'string' ? <Typography>{confirm}</Typography> : confirm}
        <ButtonRow>
          {state === 'ready' && <Button
              variant={"outlined"}
              color={"secondary"}
              onClick={close}
          >{cancelButtonText}</Button>}
          {state === 'done' && <Button
              variant={"outlined"}
              color={"secondary"}
              onClick={close}
          >{closeButtonText}</Button>
          }
          <Button
            disabled={state !== "ready"}
            variant={"contained"}
            color={"error"}
            onClick={() => {
              action(progressor)
                .catch((e) => error(`Failed '${openButtonText}' due to: ${asString(e)}`)
                  .finally(() => setState('done')))
            }}>{runButtonText}</Button>
        </ButtonRow>
      </Box>
    </Modal>
  </>
}
