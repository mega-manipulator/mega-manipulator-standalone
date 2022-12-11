import {
  Alert,
  Avatar,
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
import {DataGridPro, GridColDef, GridRenderCellParams, GridRowId} from "@mui/x-data-grid-pro";
import MenuIcon from "@mui/icons-material/Menu";
import {DeleteMenuItem} from "./DeleteMenuItem";
import {MegaContext} from "../../hooks/MegaContext";
import {OpenProjectsMenuItem, OpenWorkdirMenuItem} from "./OpenProjectsMenuItem";
import {ExecuteScriptedChangeMenuItem} from "./ExecuteScriptedChangeMenuItem";
import {MakeChangesWizard} from "./MakeChangesWizard";
import ReplayIcon from '@mui/icons-material/Replay';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {openDirs} from "../../service/file/scriptFile";

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

const boolCellProps: Partial<GridColDef<any, RepoBadStatesReport, boolean>> = {
  width: 175,
  minWidth: 50,
  maxWidth: 500,
  editable: false,
  resizable: true,
  type: "object",
  renderCell: renderBoolCell,
}
const columns: GridColDef[] = [
  {field: 'id', hideable: true, minWidth: 25, maxWidth: 100, hide: true},
  {field: 'repoPathShort', headerName: 'Repo Path', width: 400, maxWidth: 800, editable: false, resizable: true},
  {
    field: 'repoPathLong',
    headerName: 'Repo Path (Long)',
    width: 800,
    maxWidth: 800,
    editable: false,
    resizable: true,
    hideable: true,
    hide: true
  },
  {field: 'noCodeHostConfig', headerName: 'Has Code Host Config', ...boolCellProps,},
  {field: 'uncommittedChanges', headerName: 'Uncommitted Changes', ...boolCellProps,},
  {field: 'onDefaultBranch', headerName: 'Not On Default Branch', ...boolCellProps,},
  {
    field: 'noDiffWithOriginHead',
    headerName: 'Has Diff With Origin Head', ...boolCellProps,
    hideable: true,
    hide: true,
  },
];

export const ClonesPage: React.FC = () => {
  const {settings, clones: {setPaths, setSelected, selectedModel}} = useContext(MegaContext)

  const [repoStates, setRepoStates] = useState<RepoBadStatesReport[]>([])
  const [selectedRepos, setSelectedRepos] = useState<RepoBadStatesReport[]>([])
  const [reloader, setReloader] = useState(0)
  useEffect(() => {
    if (settings !== null) {
      (async () => {
        const paths = await listRepos(settings.clonePath);
        setPaths(paths)
        setRepoStates(paths.map((path) => {
          const trimmedRepoPath = path.substring((settings.clonePath?.length ?? -1) + 1)
          return new RepoBadStatesReport(path, trimmedRepoPath);
        }));
        const analysis = await Promise.all(paths.map((path) => analyzeRepoForBadStates(settings, path)))
        setRepoStates(analysis)
      })()
    }
  }, [settings, reloader])
  const reloadTrigger = useCallback(() => {
    setSelectedRepos([])
    setReloader((reloader + 1) % 10)
  }, [reloader, setReloader])

  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)

  return <>
    <Typography variant={'h4'}>Clones</Typography>
    <div>
      WorkDir: {settings.clonePath} <Tooltip title={'Open work dir in editor application'}>
      <IconButton onClick={() => openDirs(settings, [settings.clonePath])}>
        <OpenInNewIcon/>
      </IconButton>
    </Tooltip>
    </div>
    <Tooltip title={'Reload repos'}><IconButton onClick={reloadTrigger}><ReplayIcon/></IconButton></Tooltip>
    <Box sx={{width: '100%'}}>
      <DataGridPro
        autoHeight
        rows={repoStates.map((d, i) => {
          return {
            id: i,
            ...d
          }
        })}
        selectionModel={selectedModel}
        onSelectionModelChange={(model: GridRowId[]) => {
          const selectedRepoBadStatesReports = model.map((id) => repoStates[+id]);
          setSelectedRepos(selectedRepoBadStatesReports)
          setSelected(model.map((r) => +r))
        }}
        columns={columns}
        autoPageSize
        pageSize={15}
        rowsPerPageOptions={[5, 15, 100]}
        checkboxSelection
      />
    </Box>
    <Tooltip title={selectedRepos.length === 0 ? 'Select some repos to do some harm' : 'Repo Actions'}>
      <Avatar style={{position: "fixed", bottom: "10px", left: "10px"}}>
        <IconButton onClick={() => setActionsMenuOpen(true)}>
          <MenuIcon/>
        </IconButton>
      </Avatar>
    </Tooltip>
    <Drawer open={actionsMenuOpen} onClose={() => setActionsMenuOpen(false)}>
      <Typography>Do stuff with {selectedRepos.length} repos</Typography>
      <List>
        <MakeChangesWizard listItemButtonProps={{disabled: selectedRepos.length === 0}}/>
        <DeleteMenuItem listItemButtonProps={{disabled: selectedRepos.length === 0}} reloadCallback={reloadTrigger}
                        settings={settings} repos={selectedRepos}/>
        <OpenProjectsMenuItem/>
        <OpenWorkdirMenuItem/>
        <ExecuteScriptedChangeMenuItem/>
        <ListItemButton disabled={true}>Stage</ListItemButton>
        <ListItemButton disabled={true}>Commit</ListItemButton>
        <ListItemButton disabled={true}>Push</ListItemButton>
      </List>
    </Drawer>
  </>
}
