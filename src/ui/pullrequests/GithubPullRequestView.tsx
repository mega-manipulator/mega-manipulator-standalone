import {SpeedDial, SpeedDialAction, SpeedDialIcon} from "@mui/material";
import React, {useState} from "react";
import EditIcon from '@mui/icons-material/Edit'
import {useGitHubEditPrSpeedDialProps} from "./actions/GitHubEditPrSpeedDial";
import {GitHubPullRequestSearch} from "./GitHubPullRequestSearch";
import {GenericSpeedDialModal} from "./actions/GenericSpeedDialAction";
import {debug} from "tauri-plugin-log-api";
import {useGitHubClosePrSpeedDial} from "./actions/GitHubClosePrSpeedDial";
import {useGitHubReOpenPrSpeedDial} from "./actions/GitHubReOpenPrSpeedDial";
import {useGitHubClonePrSpeedDial} from "./actions/GitHubClonePrSpeedDial";
import {CloneModal, useCloneModalProps} from "../manage/clones/clonepage/CloneModal";
import {useGitHubReviewPrSpeedDial} from "./actions/useGitHubReviewPrSpeedDial";
import {useGitHubMergePrSpeedDial} from "./actions/useGitHubMergePrSpeedDial";
import {useGitHubDraftPrSpeedDial} from "./actions/GitHubDraftPrSpeedDial";
import {useGitHubOpenPrInBrowserSpeedDial} from "./actions/GitHubOpenPrInBrowserSpeedDial";

export const GithubPullRequestView: React.FC = () => {
  const cloneModalProps = useCloneModalProps()
  const [isDialOpen, setIsDialOpen] = useState(false);

  const items = [
    useGitHubEditPrSpeedDialProps(),
    useGitHubClosePrSpeedDial(),
    useGitHubReOpenPrSpeedDial(),
    useGitHubClonePrSpeedDial(cloneModalProps.cloneModalPropsWrapper.open),
    useGitHubReviewPrSpeedDial(),
    // Comment
    useGitHubOpenPrInBrowserSpeedDial(),
    useGitHubMergePrSpeedDial(),
    useGitHubDraftPrSpeedDial(),
  ]

  // Render
  return <>
    <GitHubPullRequestSearch/>
    <CloneModal {...cloneModalProps}/>
    {/* Generic Action Modals */}
    {items.map((item, idx) => <GenericSpeedDialModal key={idx} {...item} />)}

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
  </>
};
