import React, {useContext} from "react";
import {Box} from "@mui/material";
import {GridColDef, GridRowId} from "@mui/x-data-grid";
import {DataGridPro} from "@mui/x-data-grid-pro";
import {MegaContext} from "../../hooks/MegaContext";

const columns: GridColDef[] = [
  {field: 'id', hideable: true, width: 100, hide: true},
  {field: 'searchHost', headerName: 'Search Host', width: 100, editable: false},
  {field: 'codeHost', headerName: 'Code Host', width: 100, editable: false},
  {field: 'owner', headerName: 'Owner', width: 200, editable: false},
  {field: 'repo', headerName: 'Repo', width: 200, editable: false},
  {field: 'description', headerName: 'Description', width: 100, editable: false},
];

export const SearchHitTable: React.FC = () => {
  const {search: {hits, setSelected}} = useContext(MegaContext);
  return (
    <Box sx={{width: '100%'}}>
      <DataGridPro
        autoHeight
        rows={hits.map((d, i) => {
          return {
            id: i,
            ...d
          }
        })}
        onSelectionModelChange={(model: GridRowId[]) => {
          setSelected(model.map((id) => hits[+id]))
        }}
        columns={columns}
        autoPageSize
        pageSize={15}
        rowsPerPageOptions={[5, 15, 100]}
        checkboxSelection
        disableSelectionOnClick
      />
    </Box>
  );

}
