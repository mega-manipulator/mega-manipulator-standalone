import React, {useCallback, useContext, useState} from "react";
import {GenericPrSpeedDialAction} from "./GenericPrSpeedDialAction";
import EditIcon from '@mui/icons-material/Edit';
import {MegaContext} from "../../../hooks/MegaContext";
import {sleep} from "../../../service/delay";
import EditOffIcon from '@mui/icons-material/EditOff';
import {TextField, Typography} from "@mui/material";

export const GitHubEditPrSpeedDial: React.FC = () => {
  const {pullRequests: {selected}} = useContext(MegaContext)
  const [title, setTitle] = useState<string>();
  const [body, setBody] = useState<string>();
  const action = useCallback(async (
    progressCallback: (current: number, total: number) => void
  ) => {
    for (let i = 0; i < selected.length; i++) {
      await sleep(500)
      progressCallback(i, selected.length)
    }
    return {
      time: 0
    }
  }, [selected])

  // Render

  return <GenericPrSpeedDialAction
    disabled={selected.length !== 0}
    icon={selected.length === 0 ? <EditOffIcon/> : <EditIcon/>}
    tooltipTitle={selected.length === 0 ? 'Select PRs to edit' : 'Edit selected Pull Requests'}
    description={<>
      <Typography variant={'h4'}>Edit selected PRs ({selected.length})</Typography>
      <TextField
        fullWidth
        label={'Title'}
        value={title}
        onChange={(event)=>setTitle(event.target.value)}
      />
      <TextField
        fullWidth
        multiline
        minRows={5}
        label={'Body'}
        value={body}
        onChange={(event)=>setBody(event.target.value)}
      />
    </>}
    action={action}
  />
};
