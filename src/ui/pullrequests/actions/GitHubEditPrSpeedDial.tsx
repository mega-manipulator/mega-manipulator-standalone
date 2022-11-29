import React, {useCallback, useContext, useEffect, useState} from "react";
import EditIcon from '@mui/icons-material/Edit';
import {MegaContext} from "../../../hooks/MegaContext";
import {Alert, TextField, Typography} from "@mui/material";
import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {ConditionalSkeleton} from "../../ConditionalSkeleton";

export function useGitHubEditPrSpeedDialProps() {
  const {pullRequests: {selected}} = useContext(MegaContext)
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const action = useCallback(async (
    progressCallback: (current: number, total: number) => void
  ) => {
    progressCallback(0, selected.length)
    const result = await ghClient?.rewordPullRequests({
      prs: selected,
      body: {title, body},
    }, (idx: number) => progressCallback(idx + 1, selected.length))
    progressCallback(selected.length, selected.length)
    return {
      time: result?.time ?? 0,
    }
  }, [selected, body, title])
  useEffect(() => {
    setTitle(selected[0]?.title ?? '')
    setBody(selected[0]?.body ?? '')
  }, [selected]);

  return useGenericPrSpeedDialActionProps(
    'Edit selected Pull Requests',
    selected.length === 0,
    <EditIcon/>,
    <ConditionalSkeleton condition={!clientInitError} tooltipText={<Alert>{clientInitError}</Alert>}>
      <Typography variant={'h4'}>Edit selected PRs ({selected.length})</Typography>
      <TextField
        fullWidth
        label={'Title'}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextField
        fullWidth
        multiline
        minRows={5}
        label={'Body'}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
    </ConditionalSkeleton>,
    action,
  )
}
