import {Box, Modal} from "@mui/material";
import {modalStyle} from "../modal/megaModal";
import React, {useEffect, useState} from "react";
import {SearchHit} from "../search/types";
import {gitChangedFiles, GitDiff} from "../../service/file/gitCommit";
import {MegaSettingsType} from "../../hooks/settings";

export type DiffModalProps = {
  isOpen:boolean,
  setIsOpen:(isOpen:boolean) => void,
  searchHits: SearchHit[],
  settings: MegaSettingsType,
}

export const DiffModal:React.FC<DiffModalProps> = (
  {isOpen, setIsOpen, searchHits, settings}:DiffModalProps
) => {
  const [diffs, setDiffs] = useState<GitDiff[]>([])
  useEffect(()=>{
    (async ()=>{
      const newVar: GitDiff[] = await gitChangedFiles({hits:searchHits, settings});
      setDiffs(newVar)
    })()
  },[])
  return <Modal open={isOpen} onClose={() => setIsOpen(false)}>
    <Box sx={modalStyle}>
      {JSON.stringify(diffs, null, 2)}
    </Box>
  </Modal>
}
