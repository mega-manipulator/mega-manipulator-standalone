import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {MegaContext} from "../../../hooks/MegaContext";
import React, {useCallback, useContext, useState} from "react";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {Alert, MenuItem, Select, TextField} from "@mui/material";

export function useGitHubReviewPrSpeedDial() {
  const {pullRequests: {selected}} = useContext(MegaContext);
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const [event, setEvent] = useState<'REQUEST_CHANGES' | 'APPROVE'>('REQUEST_CHANGES');
  const [body, setBody] = useState('');
  const action = useCallback(async (progress: (current: number, total: number) => void) => {
      if (ghClient) {
        return await ghClient.reviewPullRequests({
          prs: selected,
          body: {
            body,
            event,
          }
        }, (idx: number) => progress(idx, selected.length));
      }
      return {
        time: 0,
      }
    },
    [selected],
  );

  return useGenericPrSpeedDialActionProps(
    'Review Pull requests',
    selected.length !== 0,
    <CheckCircleIcon/>,
    <>
      {clientInitError && <Alert color={"warning"} variant={"outlined"}>{clientInitError}</Alert>}
      <Select label={'Approval'}>
        <MenuItem value={'REQUEST_CHANGES'} onSelect={() => setEvent('REQUEST_CHANGES')}>Request Changes</MenuItem>
        <MenuItem value={'APPROVE'} onSelect={() => setEvent('APPROVE')}>Approve</MenuItem>
      </Select>
      <TextField
        label={'Review message'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
    </>,
    action
  )
}
