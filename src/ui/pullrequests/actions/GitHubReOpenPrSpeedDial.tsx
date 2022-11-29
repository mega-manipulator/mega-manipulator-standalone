import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {MegaContext} from "../../../hooks/MegaContext";
import React, {useCallback, useContext, useMemo, useState} from "react";
import {Alert, TextField, Tooltip} from "@mui/material";
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {open} from "@tauri-apps/api/shell";
import RotateRightIcon from '@mui/icons-material/RotateRight';

export function useGitHubReOpenPrSpeedDial() {
  const {pullRequests: {selected}} = useContext(MegaContext);
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const [reopenComment, setReopenComment] = useState('Whops');
  const action = useCallback(async (progressCallback: (current: number, total: number) => void) => {
    progressCallback(0, selected.length)
    if (ghClient) {
      const result = await ghClient.reOpenPullRequests({
        prs: selected,
        comment: reopenComment
      }, (idx) => progressCallback(idx + 1, selected.length))
      return {time: result.time}
    }
    return {
      time: 0
    }
  }, [selected, reopenComment, ghClient])
  const droppedBranches = useMemo(() => selected.filter((s) => s !== undefined && s.head === undefined), [selected]);
  const openPrs = useMemo(() => selected.filter((s) => s !== undefined && s.state === 'OPEN'), [selected]);

  return useGenericPrSpeedDialActionProps(
    'Re-open selected Pull requests',
    selected.length === 0,
    <RotateRightIcon/>,
    <>
      {droppedBranches.length !== 0 &&
          <Tooltip title={'Click me to open all with dropped branches in browser, to click the Restore Branch button'}>
              <Alert
                  variant={"outlined"}
                  color={"warning"}
                  onClick={() => {
                    droppedBranches.forEach((d) => open(d.htmlUrl))
                  }}
              >Some of selected PRs have got their branches dropped already</Alert>
          </Tooltip>}
      {openPrs.length !== 0 &&
          <Alert color={"warning"} variant={"outlined"}>{openPrs.length} of the selected PRs are already open 🤦</Alert>}
      {clientInitError && <Alert variant={"outlined"} color={"error"}>{clientInitError}</Alert>}

      <TextField
        label={'Re-open comment'}
        value={reopenComment}
        onChange={(event) => setReopenComment(event.target.value)}
      />
    </>,
    action
  )
}
