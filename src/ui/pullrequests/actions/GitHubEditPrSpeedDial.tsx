import React, {useCallback, useContext, useEffect, useState} from "react";
import EditIcon from '@mui/icons-material/Edit';
import {MegaContext} from "../../../hooks/MegaContext";
import {sleep} from "../../../service/delay";
import EditOffIcon from '@mui/icons-material/EditOff';
import {TextField, Typography} from "@mui/material";
import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";

export function useGitHubEditPrSpeedDialProps() {
  const {pullRequests: {selected,setSelected}} = useContext(MegaContext)
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const action = useCallback(async (
    progressCallback: (current: number, total: number) => void
  ) => {
    for (let i = 0; i < selected.length; i++) {
      await sleep(500)
      progressCallback(i, selected.length)
    }
    setSelected([])
    return {
      time: 0
    }
  }, [selected])
  useEffect(() => {
    setTitle(selected[0]?.title)
    setBody(selected[0]?.body ?? '')
  }, [selected]);


  return useGenericPrSpeedDialActionProps(
  selected.length === 0 ? 'Select PRs to edit' : 'Edit selected Pull Requests',
    selected.length === 0,
  selected.length === 0 ? <EditOffIcon/> : <EditIcon/>,
  <>
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
  </>,
  action,
  )
}
