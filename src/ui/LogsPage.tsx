import {List, ListItemButton, ListItemText, Typography} from "@mui/material";
import React, {useContext, useEffect, useState} from "react";
import {logDir} from "@tauri-apps/api/path";
import {fs} from "@tauri-apps/api";
import {openDirs} from "../service/file/scriptFile";
import {MegaContext} from "../hooks/MegaContext";

// type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE'

export const LogsPage: React.FC = () => {

  const {settings} = useContext(MegaContext);
  const [logFiles, setLogFiles] = useState<string[]>([])
  const [logDirStr, setLogDirStr] = useState('')
  useEffect(() => {
    (async () => {
      const dir = await logDir()
      setLogDirStr(dir)
      const files = await fs.readDir(dir)
      const logFiles = files.filter((it) => it.children === undefined)
        .map((it) => it.path.substring(dir.length))
      setLogFiles(logFiles)
    })()
  }, [])

  return <>
    <Typography variant={'h4'}>Logs</Typography>
    <Typography>Click to open log files in editor/viewer</Typography>
      <List>
        {logFiles.map((f, i) => <>
          <ListItemButton key={i} onClick={() => openDirs(settings, [logDirStr + f])}>
            <ListItemText primary={f}/>
          </ListItemButton>
        </>)}
      </List>
  </>
}
