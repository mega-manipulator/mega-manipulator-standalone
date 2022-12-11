import {useGenericSpeedDialActionProps} from "./GenericSpeedDialAction";
import {MegaContext} from "../../../hooks/MegaContext";
import {useCallback, useContext, useState} from "react";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {Alert, FormControl, FormHelperText, MenuItem, Select} from "@mui/material";
import {MemorableTextField} from "../../components/MemorableTextField";

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
    [ghClient, selected, body, event],
  );

  return useGenericSpeedDialActionProps(
    'Review Pull requests',
    selected.length === 0,
    <CheckCircleIcon/>,
    <>
      {clientInitError && <Alert color={"warning"} variant={"outlined"}>{clientInitError}</Alert>}
      <FormControl>
        <FormHelperText>Approval</FormHelperText>
        <Select>
          <MenuItem value={'REQUEST_CHANGES'} onSelect={() => setEvent('REQUEST_CHANGES')}>Request Changes</MenuItem>
          <MenuItem value={'APPROVE'} onSelect={() => setEvent('APPROVE')}>Approve</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <FormHelperText>Review message</FormHelperText>
        <MemorableTextField
          memProps={{
            megaFieldIdentifier: 'prReviewComment',
            value: body,
            valueChange: setBody,
          }}
          textProps={{ style:{width:'15em'}}}
        />
      </FormControl>
    </>,
    action
  )
}
