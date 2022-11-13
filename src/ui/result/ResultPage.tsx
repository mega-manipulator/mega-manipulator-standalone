import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {getResultFromStorage} from "../../service/work/workLog";
import {WorkResult, WorkResultOutput, WorkResultStatus} from "../../service/types";
import {GridColDef} from "@mui/x-data-grid";
import {Alert, AlertColor, Box, Checkbox, FormControlLabel, Modal, Typography} from "@mui/material";
import {locations} from "../route/locations";
import {modalStyle} from "../modal/megaModal";
import {DataGridPro} from "@mui/x-data-grid-pro";

export const ResultPage: React.FC = () => {
  const {ref} = useParams()
  const nav = useNavigate()
  const [resultList, setResultList] = useState<(WorkResult<any, any, any> & { id: number })[]>([])
  const [result, setResult] = useState<WorkResult<any, any, any> | null>(null)
  useEffect(() => {
    if (typeof window.__TAURI_IPC__ === 'function') {
      (async () => {
        const r = await getResultFromStorage()
        setResultList(Object.values(r).reverse().map((d, i) => {
          return {
            ...d,
            id: i,
          }
        }))
      })()
    } else {
      setResultList([{
        id: new Date().getTime(),
        status: "ok",
        input: {},
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
  useEffect(() => {
    if (ref) {
      const foo: (WorkResult<any, any, any> & { id: number }) | undefined = resultList.find((r) => `${r.time}` === ref)
      setResult(foo ?? null)
    } else {
      setResult(null);
    }
  }, [resultList, ref])

  const columns: GridColDef[] = [
    {field: 'id', hideable: true, hide: true, width: 150},
    {
      field: 'time',
      headerName: 'ref',
      hideable: true,
      width: 150,
      renderCell: (e) => <Typography style={{cursor: "pointer"}}
                                     onClick={() => nav(`${locations.result.link}/${e.value}`)}>{e.value}</Typography>
    },
    {field: 'kind', hideable: true, filterable: true,},
    {
      field: 'status', hideable: true, filterable: true, renderCell: (c) => {
        if (c.value === 'failed') {
          return <Alert color={"warning"}>Failed</Alert>
        } else if (c.value === 'ok') {
          return <Alert color={"success"}>{c.value}</Alert>
        } else {
          return <Alert color={"info"}>{c.value}</Alert>
        }
      }
    },
    {field: 'name', hideable: true, filterable: true, width: 500},
  ]
  return <>
    <Typography variant={'h4'}>Result</Typography>
    Ref: {ref}
    <Modal open={ref !== undefined} onClose={() => nav(locations.result.link)}>
      <Box sx={modalStyle}>
        <pre>
          {result && <ResultTable work={result}/>}
        </pre>
      </Box>
    </Modal>
    <br/>
    <Box sx={{height: 400, width: '100%'}}>
      <DataGridPro
        rows={resultList}
        columns={columns}
        pageSize={15}
        rowsPerPageOptions={[5, 15, 100]}
        checkboxSelection
        disableSelectionOnClick
      />
    </Box>
  </>
}

type ResultTableProps = {
  work: WorkResult<any, any, any>
}

function statusToColor(status: WorkResultStatus): AlertColor {
  switch (status) {
    case "ok":
      return 'success'
    case "failed":
      return "warning"
    case "in-progress":
      return "info"
  }
}

const ResultTable: React.FC<ResultTableProps> = ({work}: ResultTableProps) => {
  const [showJson, setShowJson] = useState(false)

  return <>
    <div><Typography><b><u>What:</u></b> {work.kind}, {work.name}</Typography></div>
    <div><Alert color={statusToColor(work.status)}>Full Result: {work.status}</Alert></div>
    <FormControlLabel label={<Typography>Show raw JSON</Typography>}
                      control={<Checkbox value={showJson} onClick={() => setShowJson(!showJson)}/>}/>
    {showJson && <>
      <hr/>
      {work.input && <Typography>Input: {JSON.stringify(work.input)}</Typography>}
        <Typography variant={'h4'}>Results:</Typography>
        <Typography style={{fontStyle: 'italic', color: 'text.secondary'}}>Click the JSON to expand/collapse it</Typography>
      <hr/>
      {work.result.map((r) => <ResultItem {...r} />)}
    </>}
  </>
}

type ResultItemProps = {
  input: any,
  output: WorkResultOutput<any>,
}

const ResultItem: React.FC<ResultItemProps> = ({input, output}) => {
  const [fatJson, setFatJson] = useState(false)
  return <div onClick={() => setFatJson(!fatJson)}>
    <div>Input:</div>
    <Typography>
      {JSON.stringify(input, null, fatJson ? 2 : undefined)}
    </Typography>

    <div>Output:</div>
    <Typography>
      {JSON.stringify(output.meta, null, fatJson ? 2 : undefined)}
    </Typography>
    <Alert color={statusToColor(output.status)}>Result: {output.status}</Alert>
    <hr/>
  </div>
}
