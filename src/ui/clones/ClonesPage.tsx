import {Chip, IconButton, SpeedDial, SpeedDialAction, SpeedDialIcon, Tooltip, Typography} from "@mui/material";
import React, {useContext, useState} from "react";
import {useDeleteMenuItem} from "./dialactions/DeleteMenuItem";
import {MegaContext} from "../../hooks/MegaContext";
import {useOpenProjectsMenuItem, useOpenWorkdirMenuItem} from "./dialactions/OpenProjectsMenuItem";
import ReplayIcon from '@mui/icons-material/Replay';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {openDirs} from "../../service/file/scriptFile";
import {ClonesTable, useClonesTableProps} from "./ClonesTable";
import EditIcon from "@mui/icons-material/Edit";
import {debug} from "tauri-plugin-log-api";
import {GenericSpeedDialActionProps, GenericSpeedDialModal} from "../components/speeddial/GenericSpeedDialAction";
import {useCreatePullRequestView} from "./dialactions/CreatePullRequestView";
import {useMakeChangesWizard} from "./dialactions/MakeChangesWizard";
import {useCommitView} from "./dialactions/CommitView";
import {useExecuteScriptedChangeMenuItem} from "./dialactions/ExecuteScriptedChangeMenuItem";
import {usePushView} from "./dialactions/PushView";
import {useStageView} from "./dialactions/StageView";

export const ClonesPage: React.FC = () => {
  const {settings} = useContext(MegaContext)

  const tableProps = useClonesTableProps();
  const [isDialOpen, setIsDialOpen] = useState(false);
  const items: GenericSpeedDialActionProps[] = [
    useMakeChangesWizard(),
    useCreatePullRequestView(),
    useCommitView(),
    useDeleteMenuItem(tableProps.reload),
    useExecuteScriptedChangeMenuItem(),
    useOpenProjectsMenuItem(),
    useOpenWorkdirMenuItem(),
    usePushView(),
    useStageView(),
  ];

  return <>
    <Typography variant={'h4'}>Clones</Typography>
    {items.map((item, idx) => <GenericSpeedDialModal key={idx} {...item} />)}
    <div>
      WorkDir: {settings.clonePath} <Tooltip title={'Open work dir in editor application'}>
      <IconButton onClick={() => openDirs(settings, [settings.clonePath])}>
        <OpenInNewIcon/>
      </IconButton>
    </Tooltip>
    </div>
    <Tooltip title={'Reload repos'}><IconButton onClick={tableProps.reload}><ReplayIcon/></IconButton></Tooltip>
    <ClonesTable {...tableProps}/>
    <SpeedDial
      open={isDialOpen}
      onClose={() => setIsDialOpen(false)}
      onClick={() => setIsDialOpen(true)}
      ariaLabel="SpeedDial openIcon example"
      sx={{position: 'fixed', bottom: 16, right: 16}}
      icon={<SpeedDialIcon icon={<EditIcon/>}/>}
    >
      {items.filter((item) => !item.disabled)
        .map((item, idx) => <SpeedDialAction
          key={idx}
          icon={item.icon}
          tooltipTitle={<Chip label={item.tooltipTitle} variant={"outlined"}/>}
          tooltipOpen={true}
          onClick={() => {
            debug('Open clocked!')
            if (!item.disabled) {
              item.setIsModalOpen(true)
            }
          }}
        />)}
    </SpeedDial>
  </>
}
