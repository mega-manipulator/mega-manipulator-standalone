import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {getResultFromStorage} from "../../service/work/workLog";
import {WorkResult} from "../../service/types";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {Typography} from "@mui/material";
import {asString} from "../../hooks/logWrapper";

export const ResultPage: React.FC = () => {
  const {ref} = useParams()
  const [result, setResult] = useState<WorkResult<any, any>[]>([])
  useEffect(() => {
    (async () => {
      const r = await getResultFromStorage()
      setResult(Object.values(r))
    })()
  }, [])
  const columns: GridColDef[] = [
    {field: 'id', hideable: true, width: 100, hide: true,},
    {field: 'kind', hideable: true, width: 100,},
    {field: 'name', hideable: true, width: 100,},
    {field: 'status', hideable: true, width: 100,},
  ]
  return <>
    <Typography variant={'h4'}>Result</Typography>
    Ref: {ref}
    <br/>
    <DataGrid
      rows={result.map((d, i) => {
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
    {asString(result)}
  </>
}
