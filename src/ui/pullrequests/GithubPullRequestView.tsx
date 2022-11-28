import {SpeedDial, SpeedDialAction, SpeedDialIcon} from "@mui/material";
import React, {useContext} from "react";
import EditIcon from '@mui/icons-material/Edit'
import {useGitHubEditPrSpeedDialProps} from "./actions/GitHubEditPrSpeedDial";
import {GitHubPullRequestSearch} from "./GitHubPullRequestSearch";
import {GenericPrSpeedDialModal} from "./actions/GenericPrSpeedDialAction";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {MegaContext} from "../../hooks/MegaContext";
import {open} from "@tauri-apps/api/shell";
import {debug} from "tauri-plugin-log-api";

export const GithubPullRequestView: React.FC = () => {
  /*
  <Select>
    <MenuItem>Decline PR</MenuItem>
    <MenuItem>Reword PR</MenuItem>
    <MenuItem>Clone PR</MenuItem>
    <MenuItem>Open in Browser</MenuItem>
    <MenuItem>Add comment</MenuItem>
    <MenuItem>Mark Approved</MenuItem>
    <MenuItem>Mark Needs Work</MenuItem>
    <MenuItem>Merge</MenuItem>
  </Select>
  */
  //
  const {pullRequests: {selected}} = useContext(MegaContext)
  const items = [
    useGitHubEditPrSpeedDialProps()
  ]

  // Render
  return <>
    <GitHubPullRequestSearch/>

    {/* Generic Action Modals */}
    {items.map((item,idx)=><GenericPrSpeedDialModal key={idx} {...item} />)}

    <SpeedDial
      ariaLabel="SpeedDial openIcon example"
      sx={{position: 'fixed', bottom: 16, left: 16}}
      icon={<SpeedDialIcon icon={<EditIcon/>}/>}
    >
      {items.filter((item)=>!item.disabled)
        .map((item,idx)=><SpeedDialAction
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

      {selected.length > 0 && <SpeedDialAction
          icon={<OpenInNewIcon/>}
          tooltipTitle={'Open selected Pull Requests in browser'}
          onClick={() => selected.forEach((s) => open(s.htmlUrl))}/>}
    </SpeedDial>
  </>
};
