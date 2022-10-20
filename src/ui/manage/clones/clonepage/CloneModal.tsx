import React, {ReactElement, useState} from "react";
import {Box, Button, List, ListItem, Modal, Typography} from "@mui/material";
import {SearchHit} from "../../../search/types";
import {useMegaSettings} from "../../../../hooks/useMegaSettings";
import {modalStyle} from "../../../modal/megaModal";

export type ClonePageProps = {
  searchHits: SearchHit[]
}

export type CloneModalReturn = {
  Component: ReactElement,
  open: () => void,
  close: () => void,
}

export const CloneModal: (props:ClonePageProps) => CloneModalReturn = ({searchHits}:ClonePageProps) => {
  const [running, setRunning] = useState(false)
  const [open, setOpen] = useState(false)
  const settings = useMegaSettings()
  const Component = <Modal open={open}>
    <Box sx={modalStyle}>
      <Typography>Clone {searchHits.length} things into {settings.clonePath}?</Typography>
      <Button
        disabled={running}
        onClick={() => setRunning(true)}
      >Start clone</Button>
      <List>
        {searchHits.map((hit) => <ListItem>{hit.searchHost}/{hit.codeHost}/{hit.owner}/{hit.repo}</ListItem>)}
      </List>
      <Button disabled={running} onClick={() => setOpen(false)}>Close</Button>
    </Box>
  </Modal>
  return {
    Component,
    close: () => setOpen(false),
    open: () => setOpen(true),
  }
};
