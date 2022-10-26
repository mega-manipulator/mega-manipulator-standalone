import {Alert, Box, CircularProgress, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {analyzeRepoForBadStates, listClones, RepoBadStatesReport} from "../../service/file/cloneDir";
import {useMegaSettings} from "../../hooks/useMegaSettings";
import {MegaSettingsType} from "../../hooks/MegaContext";
import {DataGrid, GridColDef, GridRenderCellParams} from "@mui/x-data-grid";

const renderBoolCell = (params: GridRenderCellParams) => {
  const isTruthy = params.value as boolean
  if (isTruthy)
    return <Alert variant={"filled"} severity={"error"} icon={<span>🧨</span>}>True</Alert>
  return <Alert variant={"outlined"} severity={"success"} icon={<span>👍</span>}>False</Alert>
}
const boolCellProps = {
  width: 160,
  editable: false,
  resizable: true,
  type: "boolean",
  renderCell: renderBoolCell
}
const columns: GridColDef[] = [
  {field: 'id', hideable: true, width: 100, hide: true},
  {field: 'repoPath', headerName: 'Repo Path', width: 600, editable: false, resizable: true},
  {field: 'uncommittedChanges', headerName: 'Uncommitted Changes', ...boolCellProps,},
  {field: 'onDefaultBranch', headerName: 'On Default Branch', ...boolCellProps,},
  {field: 'noDiffWithOriginHead', headerName: 'No Diff With Origin Head', ...boolCellProps,},
];

export const ClonesPage: React.FC = () => {
  const settings: MegaSettingsType | null = useMegaSettings()
  const [state, setState] = useState<'loading' | 'ready'>('loading')

  const [repoStates, setRepoStates] = useState<RepoBadStatesReport[]>([])
  useEffect(() => {
    if (settings === null) {
      setState('loading')
    } else {
      (async () => {
        const paths = await listClones(settings);
        const analysis = await Promise.all(paths.map((path) => analyzeRepoForBadStates(settings, path)))
        setRepoStates(analysis)
        setState('ready')
      })()
    }
  }, [settings])

  return <>
    <Typography variant={'h4'}>Clones</Typography>
    {state === 'loading' && <CircularProgress/>}
    {state === 'ready' && <>
        <Box sx={{height: 400, width: '100%'}}>
            <DataGrid
                rows={repoStates.map((d, i) => {
                  return {
                    id: i,
                    ...d
                  }
                })}
                columns={columns}
                pageSize={15}
                rowsPerPageOptions={[5, 15, 100]}
                checkboxSelection
                disableSelectionOnClick
            />
        </Box>
    </>
    }
  </>
}
