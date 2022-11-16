import React, {useCallback, useEffect, useState} from "react";
import {Box, Button, ListItemButton, Modal, Typography} from "@mui/material";
import {modalStyle} from "../modal/megaModal";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";

type GenericMultiProjectMenuItemProps = {
  openButtonText: string;
  confirm: string | JSX.Element,
  action: () => Promise<void>;
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
  }, []);
  const close = useCallback(() => {
    if (state !== 'running') {
      setState('ready')
      setIsOpen(false)
      closeAction()
    }
  }, [state]);

  return <>
    <ListItemButton disabled={!available} onClick={() => setIsOpen(true)}>{openButtonText}</ListItemButton>
    <Modal open={isOpen} onClose={close}>
      <Box sx={modalStyle}>
        {typeof confirm === 'string' ? <Typography>{confirm}</Typography> : confirm}
        <p style={{
          display: "grid",
          gridAutoFlow: "column",
          gridColumnGap: '10px',
        }}>
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
            variant={"contained"}
            color={"error"}
            onClick={() => {
              action()
                .then(close)
                .catch((e) => error(`Failed '${openButtonText}' due to: ${asString(e)}`).then((_) => setState('done')))
            }}>{runButtonText}</Button>
        </p>
      </Box>
    </Modal>
  </>
}
