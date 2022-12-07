import {Box, IconButton, Tooltip, Typography} from "@mui/material";
import {DataGridPro} from "@mui/x-data-grid-pro";
import React, {useContext} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {GridColDef, GridRenderCellParams, GridRowId} from "@mui/x-data-grid";
import {GitHubPull, GithubUser} from "../../hooks/github.com";
import {open} from '@tauri-apps/api/shell';
import PauseIcon from '@mui/icons-material/Pause';
import RateReviewIcon from '@mui/icons-material/RateReview';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const GithubUserColumn: React.FC<GridRenderCellParams<GithubUser, GitHubPull, unknown>> = ({value}) => {
  return <>
    <Box
      component="img"
      sx={{
        height: 24,
        width: 24,
      }}
      alt={value?.login}
      src={value?.avatarUrl}
    />&nbsp;{value?.login}
  </>
}
const OpenableUrlColum: React.FC<GridRenderCellParams<string, GitHubPull, unknown>> = ({value}) => {
  return <Tooltip title={`Open in browser: ${value}`}>
    <IconButton
      color={"primary"}
      onClick={() => value && open(value)}>
      <OpenInNewIcon/>
    </IconButton>
  </Tooltip>
}
const defaultGridColDef: Partial<GridColDef<any, GitHubPull, unknown>> = {
  hideable: true,
  minWidth: 100,
  maxWidth: 500,
  hide: false,
  resizable: true,
  sortable: true,
}

function compareGitHubUser(v1: GithubUser, v2: GithubUser): number {
  if (v1 === undefined && v2 == undefined) {
    return 0
  } else if (v1 === undefined) {
    return -1
  } else if (v2 === undefined) {
    return 1
  } else {
    return v1.login.toLowerCase().localeCompare(v2.login.toLowerCase())
  }
}

const cols: GridColDef[] = [
  {...defaultGridColDef, field: 'id', minWidth: 25, hide: true,},
  {...defaultGridColDef, field: 'prId', minWidth: 25, hide: true,},
  {...defaultGridColDef, field: 'prNumber', minWidth: 25, hide: true,},
  {...defaultGridColDef, field: 'owner', sortComparator:compareGitHubUser, renderCell: GithubUserColumn},
  {...defaultGridColDef, field: 'repo', width: 175},
  {...defaultGridColDef, field: 'author', sortComparator: compareGitHubUser, renderCell: GithubUserColumn},
  {...defaultGridColDef, field: 'title'},
  {...defaultGridColDef, field: 'body'},
  {...defaultGridColDef, field: 'state'},
  {
    ...defaultGridColDef, field: 'draft', headerName: 'Ready', renderCell: (v) => v.value ?
      <Tooltip title={'Draft'}><Typography color={"orange"}><PauseIcon/></Typography></Tooltip> :
      <Tooltip title={'In review'}><Typography color={"green"}><RateReviewIcon/></Typography></Tooltip>
  },
  {...defaultGridColDef, field: 'repositoryUrl', width: 150, renderCell: OpenableUrlColum},
  {...defaultGridColDef, field: 'htmlUrl', width: 150, renderCell: OpenableUrlColum},
  {...defaultGridColDef, field: 'filesUrl', width: 150, renderCell: OpenableUrlColum},
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
          filesUrl: `${d.htmlUrl}/files`,
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
