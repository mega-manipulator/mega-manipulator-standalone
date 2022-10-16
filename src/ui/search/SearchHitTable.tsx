import React from "react";
import {Box} from "@mui/material";
import {DataGrid, GridColDef, GridRowId} from "@mui/x-data-grid";
import {SearchHit} from "./types";
import {info} from "tauri-plugin-log-api";

export type SearchHitTableProps = {
  data: SearchHit[],
  selectionCallback: (selected: SearchHit[]) => void,
}

export const SearchHitTable: React.FC<SearchHitTableProps> = ({data, selectionCallback}) => {
  const columns: GridColDef[] = [
    {
      field: 'id',
      hideable: true,
      width: 100,
      hide: true,
    },
    {
      field: 'searchHost',
      headerName: 'Search Host',
      width: 100,
      editable: false,
    },
    {
      field: 'codeHost',
      headerName: 'Code Host',
      width: 100,
      editable: false,
    },
    {
      field: 'owner',
      headerName: 'Owner',
      width: 100,
      editable: false,
    },
    {
      field: 'repo',
      headerName: 'Repo',
      width: 100,
      editable: false,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 100,
      editable: false,
    },
  ];

  return (
    <Box sx={{height: 400, width: '100%'}}>
      <DataGrid
        rows={data.map((d, i) => {
          return {
            id: i,
            ...d
          }
        })}
        onSelectionModelChange={(model: GridRowId[]) => {
          selectionCallback(model.map((id) => data[+id]))
        }}
        columns={columns}
        pageSize={15}
        rowsPerPageOptions={[5, 15, 100]}
        checkboxSelection
        disableSelectionOnClick
      />
    </Box>
  );

}
