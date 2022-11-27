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

const cols: GridColDef[] = [
  {field: 'id', hideable: true, minWidth: 25, maxWidth: 100, hide: true},
  {field: 'owner', hideable: true, minWidth: 100, maxWidth: 400, hide: false, resizable: true, renderCell: GithubUserColumn },
  {field: 'repo', hideable: true, minWidth: 100, maxWidth: 400, hide: false, resizable: true},
  {field: 'author', hideable: true, minWidth: 100, maxWidth: 400, hide: false, resizable: true, renderCell: GithubUserColumn },
  {field: 'title', hideable: true, minWidth: 100, maxWidth: 400, hide: false, resizable: true},
  {field: 'body', hideable: true, minWidth: 100, maxWidth: 500, hide: false, resizable: true},
  {field: 'state', hideable: true, minWidth: 100, maxWidth: 500, hide: false, resizable: true},
  {
    field: 'repositoryUrl',
    hideable: true,
    minWidth: 150,
    maxWidth: 500,
    hide: false,
    resizable: true,
    renderCell: (v) => <Tooltip title={'Click me to open repo in browser'}>
      <Button
        variant={"outlined"}
        size={"small"}
        onClick={() => open(v.value)}
      >Open in browser</Button>
    </Tooltip>
  },
];

export const PullRequestsTable: React.FC = () => {
  const {pullRequests: {pulls, setSelected}} = useContext(MegaContext)

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
      onSelectionModelChange={(model: GridRowId[]) => {
        setSelected(model.map((id) => pulls[+id]));
      }}
      autoPageSize
      pageSize={15}
      rowsPerPageOptions={[5, 15, 100]}
      checkboxSelection
    />
  </Box>
}
