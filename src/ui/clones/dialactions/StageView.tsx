import {MegaContext} from "../../../hooks/MegaContext";
import {useCallback, useContext, useState} from "react";
import {Alert, Button, FormControl, FormHelperText, IconButton, Switch, Tooltip, Typography} from "@mui/material";
import FileOpenIcon from '@mui/icons-material/FileOpen';
import {
  gitGetStagedFiles,
  gitGetUnStagedFiles,
  gitStage,
  GitStageInput,
  gitUnStage
} from "../../../service/file/gitCommit";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../../hooks/logWrapper";
import {open} from "@tauri-apps/api/shell";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  GenericSpeedDialActionProps,
  useGenericSpeedDialActionProps
} from "../../components/speeddial/GenericSpeedDialAction";
import {ButtonRow} from "../../components/ButtonRow";
import ApprovalIcon from '@mui/icons-material/Approval';

export function useStageView(): GenericSpeedDialActionProps {
  const {clones: {selected}, settings} = useContext(MegaContext);
  const [stagedFiles, setStagedFiles] = useState<string[][]>([] as (string[][]));
  const [unStagedFiles, setUnStagedFiles] = useState<string[][]>([] as (string[][]));
  const [showStage, setShowStage] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isStaging, setIsStaging] = useState(false);
  const loadStagingInfo = useCallback(() => {
    setShowStage(true)
    setLoaded(true)
    gitGetStagedFiles({hits: selected, settings})
      .then((diffs) => setStagedFiles(diffs.map((d) => d.diffFiles)))
      .catch((e) => error('Failed getting the stage info ' + asString(e)));
    gitGetUnStagedFiles({hits: selected, settings})
      .then((diffs) => setUnStagedFiles(diffs.map((d) => d.diffFiles)))
      .catch((e) => error('Failed getting the unstage info ' + asString(e)));
  }, [selected, settings]);

  return useGenericSpeedDialActionProps(
    'Staging',
    selected.length === 0,
    <ApprovalIcon/>,
    selected.length === 0 ? <Alert color={'warning'} variant={'outlined'}>No Clones selected</Alert> :
      <>
        <Typography variant={'h4'}>Stage files</Typography>
        <FormControl>
          <FormHelperText>Show staging info</FormHelperText>
          <Switch checked={showStage} onClick={() => setShowStage(!showStage)}/>
        </FormControl>

        {/* Staging info */}
        {showStage && <p>
          {selected.map((a, idx) => <>
            <Typography>{a} </Typography>
            <Tooltip title={'Open project'}><IconButton onClick={() => open(a)}><FileOpenIcon/></IconButton></Tooltip>
            <Tooltip title={'Stage all'}>
              <IconButton
                onClick={() => gitStage(new GitStageInput(settings, [a], () => {
                  return;
                })).then(() => setLoaded(false))}
              ><AddIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip title={'UnStage all'}>
              <IconButton
                onClick={() => gitUnStage(new GitStageInput(settings, [a], () => {
                  return;
                })).then(() => setLoaded(false))}
              ><RemoveIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip title={'Reset entire repo (TODO 🤦)'}><IconButton
              onClick={() => window.alert(`It's on my todo-list!`)}><RestartAltIcon/></IconButton></Tooltip>
            {stagedFiles[idx]
              ? <>
                <Typography color={"#6A6"}>Staged files ({stagedFiles[idx].length}): </Typography>
                {stagedFiles[idx].map((s) => <>
                  <Tooltip title={`UnStage ${s}`}>
                    <IconButton
                      onClick={() => gitUnStage(new GitStageInput(settings, [a], () => {
                        return;
                      }, [s])).then(() => setLoaded(false))}
                    ><RemoveIcon/>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={'Reset file (TODO 🤦)'}><IconButton
                    onClick={() => window.alert(`It's on my todo-list!`)}><RestartAltIcon/></IconButton></Tooltip>
                  {s}
                </>)}</>
              : <Typography>Nothing staged</Typography>}
            {unStagedFiles[idx]
              ? <><Typography color={"#A66"}>UnStaged files ({unStagedFiles[idx].length}): </Typography>
                {unStagedFiles[idx].map((s) => <>
                  <Tooltip title={`Stage ${s}`}>
                    <IconButton
                      onClick={() => gitStage(new GitStageInput(settings, [a], () => {
                        return;
                      }, [s])).then(() => setLoaded(false))}
                    ><AddIcon/>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={'Reset file (TODO 🤦)'}><IconButton
                    onClick={() => window.alert(`It's on my todo-list!`)}><RestartAltIcon/></IconButton></Tooltip>
                  {s}
                </>)}</>
              : <Typography>Nothing unstaged</Typography>}
            <hr/>
          </>)}
        </p>}

      </>,
    undefined,
    (closeCallback) => <ButtonRow>
      <Button
        disabled={isStaging}
        onClick={closeCallback}
        variant={'outlined'}
        color={'secondary'}
      >Close</Button>

      <Button
        disabled={loaded}
        variant={"outlined"}
        onClick={loadStagingInfo}
      >Load staging status</Button>

      <Button
        disabled={isStaging}
        variant={"contained"}
        color={"success"}
        onClick={() => {
          gitStage(new GitStageInput(settings, selected, () => {
            return;
          }))
            .then(loadStagingInfo)
            .catch((e) => error(`Something failed staging files: ${asString(e)}`))
        }}
      ><AddIcon/>Stage all</Button>
      <Button
        disabled={isStaging}
        variant={"outlined"}
        color={"secondary"}
        onClick={() => {
          setIsStaging(true)
          gitUnStage(new GitStageInput(settings, selected, () => {
            return;
          }))
            .then(() => setIsStaging(false))
            .then(loadStagingInfo)
            .catch((e) => error(`Something failed un-staging files: ${asString(e)}`))
        }}
      ><RemoveIcon/>Un-Stage all</Button>

    </ButtonRow>
  )
}
