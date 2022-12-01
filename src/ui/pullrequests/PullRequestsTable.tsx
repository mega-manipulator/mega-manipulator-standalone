import {Box, Button, Tooltip} from "@mui/material";
import {DataGridPro} from "@mui/x-data-grid-pro";
import React, {useContext} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {GridColDef, GridRenderCellParams, GridRowId} from "@mui/x-data-grid";
import {GitHubPull} from "../../hooks/github.com";
import {open} from '@tauri-apps/api/shell';

const GithubUserColumn: React.FC<GridRenderCellParams<any, any, any>> = ({value}) => {
  return <>
    <Box
      component="img"
      sx={{
        height: 24,
        width: 24,
      }}
      alt={value.login}
      src={value.avatarUrl}
    />&nbsp;{value.login}
  </>
}
const defaultGridColDef: GridColDef = {
  field: 'undefined',
  hideable: true,
  minWidth: 100,
  maxWidth: 500,
  hide: false,
  resizable: true,
}
const cols: GridColDef[] = [
  {...defaultGridColDef, field: 'id', minWidth: 25, hide: true,},
  {...defaultGridColDef, field: 'prId', minWidth: 25, hide: true,},
  {...defaultGridColDef, field: 'prNumber', minWidth: 25, hide: true,},
  {...defaultGridColDef, field: 'owner', renderCell: GithubUserColumn},
  {...defaultGridColDef, field: 'repo', width:175},
  {...defaultGridColDef, field: 'author', renderCell: GithubUserColumn},
  {...defaultGridColDef, field: 'title'},
  {...defaultGridColDef, field: 'body'},
  {...defaultGridColDef, field: 'state'},
  {...defaultGridColDef, field: 'draft', renderCell: (v) => v.value ? '❌':'✅'},
  {
    ...defaultGridColDef, field: 'repositoryUrl', width: 150,
    renderCell: (v) => <Tooltip title={'Click me to open repo in browser'}>
      <Button variant={"outlined"} size={"small"} onClick={() => open(v.value)}>Open</Button>
    </Tooltip>
  },
  {
    ...defaultGridColDef, field: 'htmlUrl', width: 150,
    renderCell: (v) => <Tooltip title={'Click me to open Pull Request in browser'}>
      <Button variant={"outlined"} size={"small"} onClick={() => open(v.value)}>Open</Button>
    </Tooltip>
  },
];

export const PullRequestsTable: React.FC = () => {
  const {pullRequests: {pulls, setSelected, selectedModel}} = useContext(MegaContext)

  return <Box sx={{width: '100%'}}>
    <DataGridPro
      autoHeight
      columns={cols}
      rows={pulls.map((d: GitHubPull, i) => {
        return {
          id: i,
          ...d
        }
      })}
      selectionModel={selectedModel}
      onSelectionModelChange={(model: GridRowId[]) => {
        setSelected(model.map((id) => +id));
      }}
      autoPageSize
      pageSize={15}
      rowsPerPageOptions={[5, 15, 100]}
      checkboxSelection
    />
  </Box>
}
