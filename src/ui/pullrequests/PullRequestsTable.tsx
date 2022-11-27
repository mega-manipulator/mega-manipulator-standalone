import {Box, Button, Tooltip} from "@mui/material";
import {DataGridPro} from "@mui/x-data-grid-pro";
import {useContext} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {GridColDef, GridRowId} from "@mui/x-data-grid";
import {GitHubPull} from "../../hooks/github.com";
import {open} from '@tauri-apps/api/shell';

const cols: GridColDef[] = [
  {field: 'id', hideable: true, minWidth: 25, maxWidth: 100, hide: true},
  {field: 'owner', hideable: true, minWidth: 100, maxWidth: 400, hide: false, resizable: true},
  {field: 'repo', hideable: true, minWidth: 100, maxWidth: 400, hide: false, resizable: true},
  {field: 'title', hideable: true, minWidth: 100, maxWidth: 400, hide: false, resizable: true},
  {field: 'body', hideable: true, minWidth: 100, maxWidth: 500, hide: false, resizable: true},
  {field: 'state', hideable: true, minWidth: 100, maxWidth: 500, hide: false, resizable: true},
  {
    field: 'repository_url',
    hideable: true,
    minWidth: 150,
    maxWidth: 500,
    hide: false,
    resizable: true,
    renderCell: (v) => <Tooltip title={'This is the API-url, not the HTML-url'}>
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
