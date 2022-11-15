import {
  Alert,
  Avatar,
  Backdrop,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Tooltip,
  Typography
} from "@mui/material";
import React, {useCallback, useContext, useEffect, useState} from "react";
import {analyzeRepoForBadStates, listRepos, RepoBadStatesReport, Report} from "../../service/file/cloneDir";
import {GridColDef, GridRenderCellParams, GridRowId} from "@mui/x-data-grid";
import MenuIcon from "@mui/icons-material/Menu";
import {DeleteMenuItem} from "./DeleteMenuItem";
import {DataGridPro} from "@mui/x-data-grid-pro";
import {MegaContext} from "../../hooks/MegaContext";
import {OpenProjectsMenuItem} from "./OpenProjectsMenuItem";

const renderBoolCell = (params: GridRenderCellParams) => {
  const report = params.value as Report
  switch (report.state) {
    case "loading":
      return <CircularProgress/>
    case "good":
      return <Alert variant={"outlined"} severity={"success"} icon={<span>👍</span>}>Good</Alert>
    case "bad":
      return <Tooltip title={report.error}><Alert variant={"outlined"} severity={"warning"}
                                                  icon={<span>💩</span>}>Bad</Alert></Tooltip>
    case "failed to execute":
      return <Tooltip title={report.error}><Alert variant={"outlined"} severity={"error"} icon={<span>🧨</span>}>Failed
        to execute</Alert></Tooltip>
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
  {field: 'repoPathShort', headerName: 'Repo Path', width: 800, maxWidth: 800, editable: false, resizable: true},
  {field: 'repoPathLong', headerName: 'Repo Path (Long)', width: 800, maxWidth: 800, editable: false, resizable: true, hideable:true, hide:true},
  {field: 'noCodeHostConfig', headerName: 'Has Code Host Config', ...boolCellProps,},
  {field: 'uncommittedChanges', headerName: 'Uncommitted Changes', ...boolCellProps,},
  {field: 'onDefaultBranch', headerName: 'Not On Default Branch', ...boolCellProps,},
  {field: 'noDiffWithOriginHead', headerName: 'Has Diff With Origin Head', ...boolCellProps,},
];

export const ClonesPage: React.FC = () => {
  const {settings, clones: {setPaths, setSelected}} = useContext(MegaContext)
  const [state, setState] = useState<'loading' | 'ready'>('loading')

  const [repoStates, setRepoStates] = useState<RepoBadStatesReport[]>([])
  const [selectedRepos, setSelectedRepos] = useState<RepoBadStatesReport[]>([])
  const [reloader, setReloader] = useState(0)
  useEffect(() => {
    setState('loading')
    if (settings !== null) {
      (async () => {
        const paths = await listRepos(settings.clonePath);
        setPaths(paths)
        setRepoStates(paths.map((path) => {
          const trimmedRepoPath = path.substring((settings.clonePath?.length ?? -1) + 1)
          return new RepoBadStatesReport(path, trimmedRepoPath);
        }));
        setState('ready')
        const analysis = await Promise.all(paths.map((path) => analyzeRepoForBadStates(settings, path)))
        setRepoStates(analysis)
      })()
    }
  }, [settings, reloader])
  const reloadTrigger = useCallback(() => {
    setReloader((reloader + 1) % 10)
    setSelectedRepos([])
  }, [reloader, setReloader])

  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)

  return <>
    <Backdrop open={state === 'loading'} sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}>
      <CircularProgress/>
    </Backdrop>
    <Typography variant={'h4'}>Clones</Typography>
    {settings && <div>WorkDir: {settings?.clonePath}</div>}
    <Box sx={{width: '100%'}}>
      <DataGridPro
        autoHeight
        rows={repoStates.map((d, i) => {
          return {
            id: i,
            ...d
          }
        })}
        onSelectionModelChange={(model: GridRowId[]) => {
          const selectedRepoBadStatesReports = model.map((id) => repoStates[+id]);
          setSelectedRepos(selectedRepoBadStatesReports)
          setSelected(selectedRepoBadStatesReports.map((r) => r.repoPathLong))
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
        <DeleteMenuItem reloadCallback={reloadTrigger} settings={settings} repos={selectedRepos}/>
        <OpenProjectsMenuItem/>
        <ListItemButton disabled={true}>Make Changes</ListItemButton>
        <ListItemButton disabled={true}>Stage</ListItemButton>
        <ListItemButton disabled={true}>Commit</ListItemButton>
        <ListItemButton disabled={true}>Push</ListItemButton>
      </List>
    </Drawer>
  </>
}
