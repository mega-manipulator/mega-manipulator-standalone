import {
  Alert,
  Avatar,
  Backdrop,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem, ListItemButton,
  Tooltip,
  Typography
} from "@mui/material";
import React, {useEffect, useState} from "react";
import {analyzeRepoForBadStates, listRepos, RepoBadStatesReport, Report, ReportSate} from "../../service/file/cloneDir";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {DataGrid, GridColDef, GridRenderCellParams, GridRowId} from "@mui/x-data-grid";
import MenuIcon from "@mui/icons-material/Menu";

const renderBoolCell = (params: GridRenderCellParams) => {
  const report = params.value as Report
  switch (report.state) {
    case "loading":
      return <CircularProgress/>
    case "good":
      return <Alert variant={"outlined"} severity={"success"} icon={<span>👍</span>}>Good</Alert>
    case "bad":
      return <Tooltip title={report.error}><Alert variant={"outlined"} severity={"warning"} icon={<span>💩</span>}>Bad</Alert></Tooltip>
    case "failed to execute":
      return <Tooltip title={report.error}><Alert variant={"outlined"} severity={"error"} icon={<span>🧨</span>}>Failed to execute</Alert></Tooltip>
  }
};

const boolCellProps = {
  minWidth: 50,
  maxWidth: 500,
  editable: false,
  resizable: true,
  type: "object",
  renderCell: renderBoolCell
}
const columns: GridColDef[] = [
  {field: 'id', hideable: true, minWidth: 25, maxWidth: 100, hide: true},
  {field: 'repoPath', headerName: 'Repo Path', width: 800, maxWidth: 800, editable: false, resizable: true},
  {field: 'noCodeHostConfig', headerName: 'Has Code Host Config', ...boolCellProps,},
  {field: 'uncommittedChanges', headerName: 'Uncommitted Changes', ...boolCellProps,},
  {field: 'onDefaultBranch', headerName: 'Not On Default Branch', ...boolCellProps,},
  {field: 'noDiffWithOriginHead', headerName: 'Has Diff With Origin Head', ...boolCellProps,},
];

export const ClonesPage: React.FC = () => {
  const settings: MegaSettingsType | null = useMegaSettings()
  const [state, setState] = useState<'loading' | 'ready'>('loading')

  const [repoStates, setRepoStates] = useState<RepoBadStatesReport[]>([])
  const [selectedRepos, setSelectedRepos] = useState<RepoBadStatesReport[]>([])
  useEffect(() => {
    setState('loading')
    if (settings !== null) {
      (async () => {
        const paths = await listRepos(settings.clonePath);
        setRepoStates(paths.map((path) => new RepoBadStatesReport(path)));
        setState('ready')
        const analysis = await Promise.all(paths.map((path) => analyzeRepoForBadStates(settings, path)))
        setRepoStates(analysis)
      })()
    }
  }, [settings])

  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)

  return <>
    <Backdrop open={state === 'loading'} sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}>
      <CircularProgress/>
    </Backdrop>
    <Typography variant={'h4'}>Clones</Typography>
    {settings && <div>WorkDir: {settings?.clonePath}</div>}
    <Box sx={{width: '100%'}}>
      <DataGrid
        autoHeight
        rows={repoStates.map((d, i) => {
          return {
            id: i,
            ...d
          }
        })}
        onSelectionModelChange={(model: GridRowId[]) => {
          setSelectedRepos(model.map((id) => repoStates[+id]))
        }}
        columns={columns}
        autoPageSize
        pageSize={15}
        rowsPerPageOptions={[5, 15, 100]}
        checkboxSelection
      />
    </Box>
    <Tooltip title={selectedRepos.length === 0 ? 'Select some repos to do some harm' : 'Repo Actions'}>
      <Avatar>
        <IconButton disabled={selectedRepos.length === 0} onClick={() => setActionsMenuOpen(true)}>
          <MenuIcon/>
        </IconButton>
      </Avatar>
    </Tooltip>
    <Drawer open={actionsMenuOpen} onClose={() => setActionsMenuOpen(false)}>
      <Typography>Do stuff with {selectedRepos.length} repos</Typography>
      <List>
        <ListItemButton disabled={true}>Stage</ListItemButton>
        <ListItemButton disabled={true}>Make Changes</ListItemButton>
        <ListItemButton disabled={true}>Commit</ListItemButton>
        <ListItemButton disabled={true}>Push</ListItemButton>
      </List>
    </Drawer>
  </>
}
