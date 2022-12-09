import React, {useContext, useEffect, useState} from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Modal,
  Skeleton,
  TextareaAutosize,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import {modalStyle} from "../../../modal/megaModal";
import {clone} from "../../../../service/git/cloneWorker";
import {WorkProgress} from "../../../../service/types";
import {asString} from "../../../../hooks/logWrapper";
import {useNavigate} from "react-router-dom";
import {locations} from "../../../route/locations";
import {error, info} from "tauri-plugin-log-api";
import {MegaContext} from "../../../../hooks/MegaContext";
import {ButtonRow} from "../../../components/ButtonRow";
import {MemorableTextField} from "../../../components/MemorableTextField";

export type CloneModalPropsWrapper = {
  cloneModalPropsWrapper: CloneModalProps
}
export type CloneModalProps = {
  sourceString: string,
  setSourceString: (sourceString: string) => void,
  open: () => void,
  close: () => void,
  setOpen: (open: boolean) => void,
  isOpen: boolean,
}

export const useCloneModalProps: () => CloneModalPropsWrapper = () => {
  const [isOpen, setOpen] = useState(false)
  const [sourceString, setSourceString] = useState('')
  return {
    cloneModalPropsWrapper: {
      sourceString, setSourceString,
      open: () => {
        setOpen(true)
      },
      close: () => {
        setOpen(false)
      },
      setOpen,
      isOpen,
    }
  }
}

export const CloneModal: React.FC<CloneModalPropsWrapper> = (
  {cloneModalPropsWrapper}: CloneModalPropsWrapper
) => {
  const nav = useNavigate()
  const [fetchIfLocal, setFetchIfLocal] = useState<boolean>(false)
  const [onlyKeep, setOnlyKeep] = useState<boolean>(false)
  const [doSparseCheckout, setDoSpaseCheckout] = useState<boolean>(false)
  const [sparseCheckout, setSpaseCheckout] = useState<string>('README.md')
  const [err, setErr] = useState<string | null>(null)
  const [state, setState] = useState<'ready' | 'running' | 'done'>('ready')
  const [workRef, setWorkRef] = useState<number | null>(null)
  const {settings, search: {selected}} = useContext(MegaContext)
  const [progress, setProgress] = useState<WorkProgress | null>(null)
  const [branch, setBranch] = useState('')
  useEffect(() => {
    setBranch('batch_' + (new Date().toISOString().replaceAll(/[^a-zA-Z0-9-]/g, '_')))
  }, [])
  const normalise = (value: number) => ((value) * 100) / (selected.length);
  const close = () => {
    cloneModalPropsWrapper.setOpen(false)
    setProgress(null)
    setWorkRef(null)
    setErr(null)
  };

  return <Modal open={cloneModalPropsWrapper.isOpen} onClose={() => {
    if (state !== "running") close()
  }}>
    <Box sx={modalStyle}>
      {selected.length === 0 && <Typography>Nothing selected 🤦</Typography>}
      {selected.length !== 0 && state === 'ready' && <>
          <div>
              <Typography>Clone {selected.length} things
                  into {settings?.clonePath}?</Typography>
          </div>
        {selected.some((s) => s && s.branch === undefined) && <div>
            <TextField
                fullWidth
                variant={"filled"}
                label={'branch name'}
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
            />
        </div>}
          <div>
              <Tooltip
                  title={"Run 'git fetch' on the clones found locally, but it's faster not to run the fetch"} arrow>
                  <FormControlLabel control={
                    <Checkbox checked={fetchIfLocal} onClick={() => setFetchIfLocal(!fetchIfLocal)}/>
                  } label={<Typography>Fetch if exists locally?</Typography>}/>
              </Tooltip>
          </div>
          <div>
              <Tooltip
                  title={"Only clone to keep dir."} arrow>
                  <FormControlLabel control={
                    <Checkbox checked={onlyKeep} onClick={() => {
                      setOnlyKeep(!onlyKeep)
                      setFetchIfLocal(false)
                      setDoSpaseCheckout(false)
                    }}/>
                  } label={<Typography>Skip workdir copy?</Typography>}/>
              </Tooltip>
          </div>

          <div>
              <FormControlLabel control={
                <Checkbox checked={doSparseCheckout} onClick={() => setDoSpaseCheckout(!doSparseCheckout)}/>
              } label={'Sparse checkout?'}/>
          </div>
          <div>
            {doSparseCheckout ?
              <MemorableTextField
                memProps={{
                  megaFieldIdentifier:'sparseCheckout',
                  value:sparseCheckout,
                  valueChange:setSpaseCheckout,
                }}
                textProps={{
                  multiline:true,
                  fullWidth:true,
                  "aria-label":"minimum height",
                  minRows:3,
                  placeholder:"Minimum 3 rows",
                }}
              /> : <Skeleton animation={false}>
                <TextareaAutosize
                  aria-label="minimum height"
                  minRows={3}
                  placeholder="Minimum 3 rows"
                />
              </Skeleton>}
          </div>
      </>}

      {(state === "running" || state === 'done') && <>
          <Box sx={{width: '100%'}}>
              <LinearProgress
                  variant="determinate"
                  value={progress ? normalise(progress.done) : 0}
              />{progress?.done ?? 0}/{selected.length} done.
          </Box>
        {progress?.breakdown && Object.keys(progress?.breakdown)
          .map((k) => <>{k}: {progress.breakdown[k]},&nbsp;</>)
        }
      </>}
      {/* Buttons */}
      <ButtonRow>
        {state === 'ready' && <Button
            variant={"contained"}
            color={"primary"}
            onClick={() => {
              info('Start Cloning')
              setState("running")
              settings && clone(
                {
                  hits: selected,
                  sourceString: cloneModalPropsWrapper.sourceString,
                  branch,
                  settings,
                  onlyKeep,
                  fetchIfLocal,
                  sparseCheckout: doSparseCheckout ? sparseCheckout : null,
                },
                (progress) => {
                  setProgress(progress)
                },
              )
                .then((ref) => setWorkRef(ref))
                .catch(e => {
                  error('Failed cloning' + asString(e));
                  setErr(asString(e))
                })
                .then(() => {
                  setState('done')
                  info('Done cloning')
                });
            }}
        >Start clone</Button>}
        {state !== "running" && <Button
            variant={"outlined"}
            color={"secondary"}
            onClick={close}
        >Close</Button>}
        {state === 'done' && workRef && <>
            <Button
                variant={"contained"}
                onClick={() => nav(`${locations.result.link}/${workRef}`)}
            >Show Result</Button>
            <Button
                variant={"contained"}
                onClick={() => nav(locations.clones.link)}
            >Show Clones</Button>
        </>}
        {err && <Alert variant={"filled"} color={"error"}>err</Alert>}
      </ButtonRow>
    </Box>
  </Modal>
};
