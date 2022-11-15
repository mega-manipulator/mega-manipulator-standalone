import React, {useContext, useEffect, useState} from "react";
import {Box, Button, ListItemButton, Modal, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {modalStyle} from "../modal/megaModal";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {openDirs} from "../../service/file/scriptFile";
import {os} from "@tauri-apps/api";

export const OpenProjectsMenuItem: React.FC = () => {
  const {clones: {selected}, settings} = useContext(MegaContext);
  const [isOpen, setIsOpen] = useState(false);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    (async ()=>{
      if((await os.type()) === "Darwin"){
        setAvailable(true)
      }
    })()
  }, []);

  return <>
    <ListItemButton disabled={!available} onClick={()=>setIsOpen(true)}>Open with EditorApplication</ListItemButton>
    <Modal open={isOpen} onClose={() => setIsOpen(false)}>
      <Box sx={modalStyle}>
        <Typography>Really Run open {selected.length} with {settings.editorApplication}?</Typography>
        <Button variant={"outlined"} color={"secondary"} onClick={() => setIsOpen(false)}>Get me out of here 🐣</Button>
        <Button
          variant={"contained"}
          color={"error"}
          onClick={() => {
              openDirs(settings,selected)
                .catch((e)=>error(`Failed opening projects with ${settings.editorApplication} due to: ${asString(e)}`))
          }}>Yea 🧨</Button>
      </Box>
    </Modal>
  </>
};
