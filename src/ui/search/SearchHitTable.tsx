import React, {useContext, useMemo} from "react";
import {Alert, Box, Tooltip} from "@mui/material";
import {DataGridPro, GridRowId} from "@mui/x-data-grid-pro";
import {MegaContext} from "../../hooks/MegaContext";

export const SearchHitTable: React.FC = () => {
  const {search: {hits, setSelected, selectedModel}, settings: {codeHosts}} = useContext(MegaContext);
  const codeHostKeys = useMemo(() => Object.keys(codeHosts), [codeHosts]);
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
        selectionModel={selectedModel}
        onSelectionModelChange={(model: GridRowId[]) => {
          setSelected(model.map((id) => +id))
        }}
        columns={[
          {field: 'id', hideable: true, width: 100, hide: true},
          {field: 'searchHost', headerName: 'Search Host', width: 150, editable: false},
          {
            field: 'codeHost',
            headerName: 'Code Host',
            width: 150,
            editable: false,
            renderCell: ({value}) => codeHostKeys.some((k) => k === value) ? <>{value}</> :
              <Tooltip title={'Code host unknown'}><Alert variant={"outlined"}
                                                          color={"warning"}>{value}</Alert></Tooltip>
          },
          {field: 'owner', headerName: 'Owner', width: 200, editable: false},
          {field: 'repo', headerName: 'Repo', width: 200, editable: false},
          {field: 'description', headerName: 'Description', width: 100, editable: false},
        ]}
        autoPageSize
        pageSize={15}
        rowsPerPageOptions={[5, 15, 100]}
        checkboxSelection
        disableSelectionOnClick
      />
    </Box>
  );

}
