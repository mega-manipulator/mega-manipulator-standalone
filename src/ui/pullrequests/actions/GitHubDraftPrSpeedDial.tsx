import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {MegaContext} from "../../../hooks/MegaContext";
import React, {useCallback, useContext, useState} from "react";
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {Alert, FormControlLabel, Switch} from "@mui/material";
import AlarmOnIcon from '@mui/icons-material/AlarmOn';

export function useGitHubDraftPrSpeedDial() {
  const {pullRequests: {selected}} = useContext(MegaContext);
  const [filter, setFilter] = useState(true);
  const [draft, setDraft] = useState(false);
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const action = useCallback(async (progress: (current: number, total: number) => void) => {
    progress(0, selected.length)
    if (ghClient) {
      const prs = selected.filter((s) => !filter || (s.draft != draft))
      return await ghClient.prDraftOrReadyForReview({
        prs,
        draft,
      }, (idx: number) => progress(idx, selected.length))
    }
    return {
      time: 0
    }
  }, [selected, filter])

  return useGenericPrSpeedDialActionProps(
    'Change Draft status',
    selected.length === 0,
    <AlarmOnIcon/>,
    <>
      {clientInitError && <Alert
          variant={"outlined"} color={"warning"}
      >{clientInitError}</Alert>}
      <div>
        <FormControlLabel
          control={<Switch checked={draft} onClick={() => setDraft(!draft)}/>}
          label={<>Set the PRs as {draft ? 'drafts' : 'ready for review'}</>}/>
      </div>
      <div>
        <FormControlLabel
          control={<Switch checked={filter} onClick={() => setFilter(!filter)}/>}
          label={<>Filter only {draft ? 'ready' : 'draft'} PRs</>}/>
      </div>
    </>,
    action,
  )
}
