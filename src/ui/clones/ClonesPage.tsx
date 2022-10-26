import {Alert, Backdrop, Box, CircularProgress, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {analyzeRepoForBadStates, listClones, RepoBadStatesReport, ReportSate} from "../../service/file/cloneDir";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {DataGrid, GridColDef, GridRenderCellParams, GridRowId} from "@mui/x-data-grid";

const renderBoolCell = (params: GridRenderCellParams) => {
  const isTruthy = params.value as ReportSate
  if (isTruthy === 'loading')
    return <CircularProgress/>
  if (isTruthy === "failed to execute")
    return <Alert variant={"filled"} severity={"error"} icon={<span>🧨</span>}>Failed to execute</Alert>
  else if (isTruthy === "bad")
    return <Alert variant={"outlined"} severity={"success"} icon={<span>💩</span>}>Bad</Alert>
  else if (isTruthy === "good")
    return <Alert variant={"outlined"} severity={"success"} icon={<span>👍</span>}>Good</Alert>
  else
    return <Alert variant={"filled"} severity={"error"} icon={<span>🧨</span>}>Unknown state</Alert>
}
const boolCellProps = {
  width: 160,
  editable: false,
  resizable: true,
  type: "object",
  renderCell: renderBoolCell
}
const columns: GridColDef[] = [
  {field: 'id', hideable: true, width: 100, hide: true},
  {field: 'repoPath', headerName: 'Repo Path', width: 600, editable: false, resizable: true},
  {field: 'noSearchHostConfig', headerName: 'Has Search Host Config', ...boolCellProps,},
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
    if (settings === null) {
      setState('loading')
    } else {
      (async () => {
        const paths = await listClones(settings);
        setRepoStates(paths.map((path) => new RepoBadStatesReport(path)));
        const analysis = await Promise.all(paths.map((path) => analyzeRepoForBadStates(settings, path)))
        setRepoStates(analysis)
        setState('ready')
      })()
    }
  }, [settings])

  return <>
    <Backdrop open={state === 'loading'} sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}>
      <CircularProgress/>
    </Backdrop>
    <Typography variant={'h4'}>Clones</Typography>
    {selectedRepos.length} selected
    <Box sx={{height: 400, width: '100%'}}>
      <DataGrid
        rows={repoStates.map((d, i) => {
          return {
            id: i,
            ...d
          }
        })}
        onSelectionModelChange={(model: GridRowId[]) => {
          setSelectedRepos(model.map((id)=>repoStates[+id]))
        }}
        columns={columns}
        pageSize={15}
        rowsPerPageOptions={[5, 15, 100]}
        checkboxSelection
        disableSelectionOnClick
      />
    </Box>
  </>
}
