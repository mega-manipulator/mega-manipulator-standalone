import React from "react";
import {Box, Modal} from "@mui/material";

export const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  minWidth: '100',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow:'scroll',
  bgcolor: 'background.paper',
  border: '2px solid #fff',
  boxShadow: 24,
  p: 4,
};

export type MegaModalProps = {
  children: JSX.Element,
  open: boolean,
}
export const MegaModal: React.FC<MegaModalProps> = ({children, open}) => {
  return <Modal open={open}>
    <Box sx={modalStyle}>
      {children}
    </Box>
  </Modal>
}
