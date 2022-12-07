import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {MegaContext} from "../../../hooks/MegaContext";
import {useCallback, useContext, useMemo, useState} from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import {Alert, Checkbox, FormControlLabel, TextField} from "@mui/material";
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";

export function useGitHubClosePrSpeedDial() {
  const {pullRequests: {selected}} = useContext(MegaContext);
  const {ghClient, clientInitError} = useGitHubCodeClient()
  const [closeComment, setCloseComment] = useState('Whops');
  const [dropBranch, setDropBranch] = useState(true);
  const action = useCallback(async (progressCallback: (current: number, total: number) => void) => {
    progressCallback(0, selected.length)
    if (ghClient) {
      const result = await ghClient.closePullRequests({
        prs: selected,
        comment: closeComment,
        dropBranch,
      }, (idx) => progressCallback(idx + 1, selected.length))
      return {time: result.time}
    }
    return {
      time: 0
    }
  }, [selected, closeComment, ghClient, dropBranch])
  const closedPrs = useMemo(() => selected.filter((s) => s !== undefined && s.state === 'CLOSED'), [selected]);
  return useGenericPrSpeedDialActionProps(
    'Close selected Pull requests',
    selected.length === 0,
    <DeleteIcon/>,
    <>
      {clientInitError && <Alert color={"error"} variant={"outlined"}>{clientInitError}</Alert>}
      {closedPrs.length !== 0 &&
          <Alert color={"warning"} variant={"outlined"}>{closedPrs.length} of the selected PRs are already closed
              🤦</Alert>}
      <FormControlLabel
        control={<Checkbox value={dropBranch} onClick={() => setDropBranch(!dropBranch)}/>}
        label={'Drop Branch after closing PR, CANNOT BE UNDONE'}/>
      <TextField
        label={'Close Comment'}
        value={closeComment}
        onChange={(event) => setCloseComment(event.target.value)}
      />
    </>,
    action
  )
}
