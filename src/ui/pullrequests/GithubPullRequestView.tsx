import React from "react";
import {useGitHubEditPrSpeedDialProps} from "./actions/GitHubEditPrSpeedDial";
import {GitHubPullRequestSearch} from "./GitHubPullRequestSearch";
import {GenericSpeedDialActionProps, GenericSpeedDialModal} from "../components/speeddial/GenericSpeedDialAction";
import {useGitHubClosePrSpeedDial} from "./actions/GitHubClosePrSpeedDial";
import {useGitHubReOpenPrSpeedDial} from "./actions/GitHubReOpenPrSpeedDial";
import {useGitHubClonePrSpeedDial} from "./actions/GitHubClonePrSpeedDial";
import {CloneModal, useCloneModalProps} from "../manage/clones/clonepage/CloneModal";
import {useGitHubReviewPrSpeedDial} from "./actions/useGitHubReviewPrSpeedDial";
import {useGitHubMergePrSpeedDial} from "./actions/useGitHubMergePrSpeedDial";
import {useGitHubDraftPrSpeedDial} from "./actions/GitHubDraftPrSpeedDial";
import {useGitHubOpenPrInBrowserSpeedDial} from "./actions/GitHubOpenPrInBrowserSpeedDial";
import {GenericSpeedDial} from "../components/speeddial/GenericSpeedDial";

export const GithubPullRequestView: React.FC = () => {
  const cloneModalProps = useCloneModalProps()

  const items: GenericSpeedDialActionProps[] = [
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

    <GenericSpeedDial items={items}/>
  </>
};
