import {
  Avatar,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tooltip,
  Typography
} from "@mui/material";
import React, {useContext, useState} from "react";
import MenuIcon from "@mui/icons-material/Menu";
import {DeleteMenuItem} from "./DeleteMenuItem";
import {MegaContext} from "../../hooks/MegaContext";
import {OpenProjectsMenuItem, OpenWorkdirMenuItem} from "./OpenProjectsMenuItem";
import {ExecuteScriptedChangeMenuItem} from "./ExecuteScriptedChangeMenuItem";
import {MakeChangesWizard} from "./MakeChangesWizard";
import ReplayIcon from '@mui/icons-material/Replay';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {openDirs} from "../../service/file/scriptFile";
import {ClonesTable, useClonesTableProps} from "./ClonesTable";
import EditIcon from "@mui/icons-material/Edit";
import {debug} from "tauri-plugin-log-api";
import {GenericSpeedDialActionProps, GenericSpeedDialModal} from "../pullrequests/actions/GenericSpeedDialAction";

export const ClonesPage: React.FC = () => {
  const {settings, clones:{selected: selectedRepos}} = useContext(MegaContext)

  const tableProps = useClonesTableProps();
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [isDialOpen, setIsDialOpen] = useState(false);
  const items: GenericSpeedDialActionProps[] = [];

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
      onClose={()=>setIsDialOpen(false)}
      onClick={()=> setIsDialOpen(true)}
      ariaLabel="SpeedDial openIcon example"
      sx={{position: 'fixed', bottom: 16, right: 16}}
      icon={<SpeedDialIcon icon={<EditIcon/>}/>}
    >
      {items.filter((item) => !item.disabled)
        .map((item, idx) => <SpeedDialAction
          key={idx}
          icon={item.icon}
          tooltipTitle={item.tooltipTitle}
          onClick={() => {
            debug('Open clocked!')
            if (!item.disabled) {
              item.setIsModalOpen(true)
            }
          }}
        />)}

    </SpeedDial>
    <Tooltip title={'Repo Actions'}>
      <Avatar style={{position: "fixed", bottom: "10px", left: "10px"}}>
        <IconButton onClick={() => setActionsMenuOpen(true)}>
          <MenuIcon/>
        </IconButton>
      </Avatar>
    </Tooltip>
    <Drawer open={actionsMenuOpen} onClose={() => setActionsMenuOpen(false)}>
      <Typography>Do stuff with {selectedRepos.length} repos</Typography>
      <List>
        <MakeChangesWizard listItemButtonProps={{disabled: selectedRepos.length === 0}}/>
        <DeleteMenuItem listItemButtonProps={{disabled: selectedRepos.length === 0}} reloadCallback={tableProps.reload}/>
        <OpenProjectsMenuItem/>
        <OpenWorkdirMenuItem/>
        <ExecuteScriptedChangeMenuItem/>
        <ListItemButton disabled={true}>Stage</ListItemButton>
        <ListItemButton disabled={true}>Commit</ListItemButton>
        <ListItemButton disabled={true}>Push</ListItemButton>
      </List>
    </Drawer>
  </>
}
