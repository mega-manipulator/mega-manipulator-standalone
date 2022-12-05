import {MegaContext} from "../../hooks/MegaContext";
import React, {useCallback, useContext, useEffect, useState} from "react";
import {Button, FormControlLabel, IconButton, Switch, Tooltip, Typography} from "@mui/material";
import FileOpenIcon from '@mui/icons-material/FileOpen';
import {
  gitGetStagedFiles,
  gitGetUnStagedFiles,
  gitStage,
  GitStageInput,
  gitUnStage
} from "../../service/file/gitCommit";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {open} from "@tauri-apps/api/shell";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export const StageView: React.FC = () => {
  const {clones: {selected}, settings} = useContext(MegaContext);
  const [stagedFiles, setStagedFiles] = useState<string[][]>([] as (string[][]));
  const [unStagedFiles, setUnStagedFiles] = useState<string[][]>([] as (string[][]));
  const [showStage, setShowStage] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isStaging, setIsStaging] = useState(false);
  const loadStagingInfo = useCallback(() => {
    setShowStage(!showStage)
    if (!loaded) {
      setLoaded(true)
      gitGetStagedFiles({hits: selected, settings})
        .then((diffs) => setStagedFiles(diffs.map((d) => d.diffFiles)))
        .catch((e) => error('Failed getting the stage info ' + asString(e)));
      gitGetUnStagedFiles({hits: selected, settings})
        .then((diffs) => setUnStagedFiles(diffs.map((d) => d.diffFiles)))
        .catch((e) => error('Failed getting the unstage info ' + asString(e)));
    }
  }, [stagedFiles, unStagedFiles, selected, loaded, showStage]);
  useEffect(() => {
    setLoaded(false)
    setShowStage(false)
    setStagedFiles([])
    setUnStagedFiles([])
  }, [selected]);

  return <>
    <FormControlLabel
      control={<Switch checked={showStage} onClick={loadStagingInfo}/>}
      label={'Show staging info'}
    />

    {/* Staging info */}
    {showStage && <p>
      {selected.map((a, idx) => <>
        <Typography>{a} </Typography>
        <Tooltip title={'Open project'}><IconButton onClick={() => open(a)}><FileOpenIcon/></IconButton></Tooltip>
        <Tooltip title={'Stage all'}>
          <IconButton
            onClick={() => gitStage(new GitStageInput(settings, [a])).then(() => setLoaded(false))}
          ><AddIcon/>
          </IconButton>
        </Tooltip>
        <Tooltip title={'UnStage all'}>
          <IconButton
            onClick={() => gitUnStage(new GitStageInput(settings, [a])).then(() => setLoaded(false))}
          ><RemoveIcon/>
          </IconButton>
        </Tooltip>
        <Tooltip title={'Reset entire repo (TODO 🤦)'}><IconButton onClick={()=>window.alert(`It's on my todo-list!`)}><RestartAltIcon/></IconButton></Tooltip>
        {stagedFiles[idx]
          ? <>
            <Typography color={"#6A6"}>Staged files ({stagedFiles[idx].length}): </Typography>
            {stagedFiles[idx].map((s) => <>
              <Tooltip title={`UnStage ${s}`}>
                <IconButton
                  onClick={() => gitUnStage(new GitStageInput(settings, [a], [s])).then(() => setLoaded(false))}
                ><RemoveIcon/>
                </IconButton>
              </Tooltip>
              <Tooltip title={'Reset file (TODO 🤦)'}><IconButton onClick={()=>window.alert(`It's on my todo-list!`)}><RestartAltIcon/></IconButton></Tooltip>
              {s}
            </>)}</>
          : <Typography>Nothing staged</Typography>}
        {unStagedFiles[idx]
          ? <><Typography color={"#A66"}>UnStaged files ({unStagedFiles[idx].length}): </Typography>
            {unStagedFiles[idx].map((s) => <>
              <Tooltip title={`Stage ${s}`}>
                <IconButton
                  onClick={() => gitStage(new GitStageInput(settings, [a], [s])).then(() => setLoaded(false))}
                ><AddIcon/>
                </IconButton>
              </Tooltip>
              <Tooltip title={'Reset file (TODO 🤦)'}><IconButton onClick={()=>window.alert(`It's on my todo-list!`)}><RestartAltIcon/></IconButton></Tooltip>
              {s}
            </>)}</>
          : <Typography>Nothing unstaged</Typography>}
        <hr/>
      </>)}
    </p>}


    {/* Buttons */}
    <p style={{
      display: "grid",
      gridAutoFlow: "column",
      gridColumnGap: '10px',
    }}>
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
          setIsStaging(true)
          gitStage(new GitStageInput(settings, selected))
            .catch((e) => error(`Something failed staging files: ${asString(e)}`))
            .then(() => {
              setIsStaging(false);
              setLoaded(false)
            })
        }}
      ><AddIcon/>Stage all</Button>
      <Button
        disabled={isStaging}
        variant={"outlined"}
        color={"secondary"}
        onClick={() => {
          setIsStaging(true)
          gitUnStage(new GitStageInput(settings, selected))
            .catch((e) => error(`Something failed un-staging files: ${asString(e)}`))
            .then(() => {
              setIsStaging(false)
              setLoaded(false)
            })
        }}
      ><RemoveIcon/> Un-Stage all</Button>
    </p>
  </>
}
