import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {getResultFromStorage} from "../../service/work/workLog";
import {WorkResult} from "../../service/types";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {Box, Typography} from "@mui/material";

export const ResultPage: React.FC = () => {
  const {ref} = useParams()
  const [result, setResult] = useState<(WorkResult<any, any> & { id: number })[]>([])
  useEffect(() => {
    if (typeof window.__TAURI_IPC__ === 'function') {
      (async () => {
        const r = await getResultFromStorage()
        setResult(Object.values(r).reverse().map((d, i) => {
          return {
            ...d,
            id: i,
          }
        }))
      })()
    } else {
      setResult([{
        id: new Date().getTime(),
        status: "ok",
        result: [{
          input: {},
          output: {status: "ok", meta: {}}
        }],
        name: 'foo',
        time: new Date().getTime(),
        kind: "clone"
      }])
    }
  }, [])
  const columns: GridColDef[] = [
    {field: 'id', hideable: true, hide: true, width: 150},
    {field: 'time', headerName: 'ref', hideable: true, width: 150},
    {field: 'kind', hideable: true},
    {field: 'status', hideable: true},
    {field: 'name', hideable: true, width: 500},
  ]
  return <>
    <Typography variant={'h4'}>Result</Typography>
    Ref: {ref}
    <br/>
    <Box sx={{height: 400, width: '100%'}}>
      <DataGrid
        rows={result}
        columns={columns}
        pageSize={15}
        rowsPerPageOptions={[5, 15, 100]}
        checkboxSelection
        disableSelectionOnClick
      />
    </Box>
  </>
}
