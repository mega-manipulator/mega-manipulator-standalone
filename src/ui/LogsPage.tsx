import {Button, IconButton, Tooltip, Typography} from "@mui/material";
import React, {useContext, useEffect, useState} from "react";
import {logDir} from "@tauri-apps/api/path";
import {fs, process} from "@tauri-apps/api";
import {MegaContext} from "../hooks/MegaContext";
import {DataGridPro} from "@mui/x-data-grid-pro";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import {openDirs} from "../service/file/scriptFile";
import {asString} from "../hooks/logWrapper";
import {error, info, warn} from "tauri-plugin-log-api";
// type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE'
type FileRef = {
  path: string,
  name: string,
  id: number,
}

export const LogsPage: React.FC = () => {

  const {settings} = useContext(MegaContext);
  const [logFiles, setLogFiles] = useState<FileRef[]>([])
  const [logDirStr, setLogDirStr] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    (async () => {
      const dir = await logDir()
      setLogDirStr(dir)
      const files = await fs.readDir(dir)
      const logFiles = files.filter((it) => it.children === undefined)
        .map((it, i) => ({
          path: it.path,
          name: it.path.substring(dir.length),
          id: i
        }))
      setLogFiles(logFiles)
    })()
  }, [reload, settings])

  return <>
    <Typography variant={'h4'}>Logs</Typography>
    {logDirStr && logDirStr !== '' && <Tooltip title={logDirStr}>
      <Button variant={"outlined"} color={"secondary"}
              onClick={() => openDirs(settings, [logDirStr])}
      >Open log dir<FileOpenIcon/></Button>
    </Tooltip>}
    <DataGridPro
      autoHeight
      autoPageSize
      checkboxSelection={false}
      rowsPerPageOptions={[10, 50, 100]}
      columns={[
        {field: 'id', hideable: true, resizable: true,},
        {field: 'name', width: 400},
        {
          field: 'open',
          headerName: 'Open',
          renderCell: ({row}) => <Tooltip title={`Open log file in editor/viewer`}><IconButton
            onClick={() => openDirs(settings, [row.path])}
          ><FileOpenIcon/></IconButton></Tooltip>
        },
        {
          field: 'delete',
          headerName: 'Delete',
          renderCell: ({row}) => <Tooltip
            title={`${row.name === 'mega-manipulator.log' ? 'THIS IS THE CURRENT LOG FILE, DELETION WILL TRIGGER A RESTART!! ' :
              ''}Delete log forever, no prompts, just BOOOOOM 🧨😅`}><IconButton
            onClick={() => fs.removeFile(row.path)
              .then(() => {
                info(`Deleted log file ${row.path}`)
                if (row.name === 'mega-manipulator.log') {
                  process.relaunch()
                    .then(() => warn('Will now restart application'))
                    .catch((e) => error(`Failed restarting application: ${asString(e)}`))
                }
              })
              .catch((e) => error(`Failed deleting log file '${row.path}' ${asString(e)}`))
              .finally(() => setReload(reload + 1))}
          ><DeleteForeverIcon/></IconButton></Tooltip>
        },
      ]} rows={logFiles}/>
    {/*<List>
        {logFiles.map((f, i) => <>
          <ListItemButton key={i} onClick={() => openDirs(settings, [logDirStr + f])}>
            <ListItemText primary={f}/>
          </ListItemButton>
        </>)}
      </List>*/}
  </>
}
