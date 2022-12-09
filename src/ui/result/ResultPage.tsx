import React, {ReactNode, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {
  deleteResultFromStorage,
  getResultFromStorage,
  listResultInStorage,
  pruneOldestResultsFromStorage
} from "../../service/work/workLog";
import {WorkResult, WorkResultOutput, WorkResultStatus} from "../../service/types";
import {GridColDef} from "@mui/x-data-grid";
import {
  Alert,
  AlertColor,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  IconButton,
  Modal,
  Tooltip,
  Typography
} from "@mui/material";
import {locations} from "../route/locations";
import {modalStyle} from "../modal/megaModal";
import {DataGridPro} from "@mui/x-data-grid-pro";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

type WorkResultWithId = WorkResult<unknown, unknown, unknown> & { id: string }

export const ResultPage: React.FC = () => {
  const {ref} = useParams()
  const nav = useNavigate()
  const [reload, setReload] = useState(0)
  const [resultList, setResultList] = useState<WorkResultWithId[]>([])
  const [result, setResult] = useState<WorkResult<unknown, unknown, unknown> | null>(null)
  useEffect(() => {
    if (typeof window.__TAURI_IPC__ === 'function') {
      (async () => {
        const list = (await listResultInStorage()).reverse()
        const r: (WorkResult<unknown, unknown, unknown> | null)[] = await Promise.all(list.map((v) => getResultFromStorage(v)));
        const mapped: WorkResultWithId[] = list.map((d: string, i: number) => {
          const rElement: WorkResult<unknown, unknown, unknown> | null = r[i];
          if (rElement === null) {
            let time = 0;
            if (!isNaN(+d)) time = +d;
            return {
              id: d,
              time,
              result: [],
              status: "failed",
              input: {},
              name: 'Failed loading from storage',
              kind: 'unknown'
            };
          }
          return {
            ...rElement,
            id: d,
          };
        })
        setResultList(mapped)
      })()
    } else {
      setResultList([{
        id: `${new Date().getTime()}`,
        status: "in-progress",
        input: {},
        result: [{
          input: {},
          output: {status: "ok", meta: {}}
        }],
        name: 'Dummy data foo',
        time: new Date().getTime(),
        kind: "clone"
      }])
    }
  }, [reload])
  useEffect(() => {
    if (ref) {
      const foo: WorkResultWithId | undefined = resultList.find((r) => `${r.time}` === ref)
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
    {
      field: 'remove',
      hideable: true,
      filterable: false,
      width: 200,
      renderCell: ({id}) => (<Box><Tooltip title={'Delete result, wont even show you a popup!!'}>
        <IconButton
          onClick={() => {
            deleteResultFromStorage(`${id}`).then(() => setReload(reload + 1))
          }}
        ><DeleteForeverIcon/></IconButton>
      </Tooltip></Box> as ReactNode)
    }
  ]
  return <>
    <Typography variant={'h4'}>Result</Typography>
    <div>Ref: {ref}</div>
    <Modal open={ref !== undefined} onClose={() => nav(locations.result.link)}>
      <Box sx={modalStyle}>
        <pre>
          {result && <ResultTable work={result}/>}
        </pre>
      </Box>
    </Modal>
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
    <div>
      <Tooltip title={'No warning, or confirm dialog, just BAM!'}>
        <Button
          variant={"outlined"} color={"warning"}
          onClick={() => pruneOldestResultsFromStorage(100).then(() => setReload(reload + 1))}
        >Remove oldest Results, leaving only 100</Button>
      </Tooltip>
    </div>
  </>
}

type ResultTableProps = {
  work: WorkResult<unknown, unknown, unknown>
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
    <FormControl>
      <FormHelperText><Typography>Show raw JSON</Typography></FormHelperText>
      <Checkbox value={showJson} onClick={() => setShowJson(!showJson)}/>
    </FormControl>
    {showJson && <>
        <hr/>
      {work.input && <Typography>Input: {JSON.stringify(work.input)}</Typography>}
        <Typography variant={'h4'}>Results:</Typography>
        <Typography style={{fontStyle: 'italic', color: 'text.secondary'}}
        >Click the JSON to expand/collapse it</Typography>
        <hr/>
      {work.result.map((r, index) => <ResultItem key={index} {...r} />)}
    </>}
  </>
}

type ResultItemProps = {
  input: unknown,
  output: WorkResultOutput<unknown>,
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
