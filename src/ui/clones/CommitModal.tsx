import {Box, CircularProgress, FormControlLabel, Modal, TextField} from "@mui/material";
import {SearchHit} from "../search/types";
import {useState} from "react";
import {modalStyle} from "../modal/megaModal";
import {MegaSettingsType} from "../../hooks/MegaContext";

export type CommitModalProps = {
  searchHits: SearchHit[],
  settings: MegaSettingsType,
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
}

type CloneModalState = 'loading' | 'ready' | 'inProgress' | 'done'

export const CommitModal: React.FC<CommitModalProps> = (
  {isOpen, setIsOpen}: CommitModalProps
) => {

  const [state, setState] = useState<CloneModalState>('loading')

  return <Modal open={isOpen}>
    {state === 'loading' ? <CircularProgress/> :
      <Box sx={modalStyle}>
        <FormControlLabel label={'Commit message'} control={<TextField/>}/>
      </Box>
    }
  </Modal>
}
