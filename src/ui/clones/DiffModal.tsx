import {Box, Modal} from "@mui/material";
import {modalStyle} from "../modal/megaModal";
import {useEffect, useState} from "react";
import {SearchHit} from "../search/types";
import {gitChangedFiles, gitStage} from "../../service/file/gitCommit";
import {MegaSettingsType} from "../../hooks/MegaContext";

export type DiffModalProps = {
  isOpen:boolean,
  setIsOpen:(isOpen:boolean) => void,
  searchHits: SearchHit[],
  settings: MegaSettingsType,
}

export const DiffModal = (
  {isOpen, setIsOpen, searchHits, settings}:DiffModalProps
) => {
  const [diffs, setDiffs] = useState<{ hit: SearchHit, path: string, diff: string[] }[]>([])
  useEffect(()=>{
    (async ()=>{
      const newVar: { hit: SearchHit; path: string; diff: string[] }[] = await gitChangedFiles({hits:searchHits, settings});
      setDiffs(newVar)
    })()
  },[])
  return <Modal open={isOpen} onClose={() => setIsOpen(false)}>
    <Box sx={modalStyle}>
      {JSON.stringify(diffs, null, 2)}
    </Box>
  </Modal>
}
