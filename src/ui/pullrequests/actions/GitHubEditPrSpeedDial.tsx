import {useCallback, useContext, useEffect, useState} from "react";
import EditIcon from '@mui/icons-material/Edit';
import {MegaContext} from "../../../hooks/MegaContext";
import {Alert, FormControl, FormHelperText, Typography} from "@mui/material";
import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {MemorableTextField} from "../../components/MemorableTextField";

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
  }, [selected, ghClient, title, body])
  useEffect(() => {
    setTitle(selected[0]?.title ?? '')
    setBody(selected[0]?.body ?? '')
  }, [selected]);

  return useGenericPrSpeedDialActionProps(
    'Edit selected Pull Requests',
    selected.length === 0,
    <EditIcon/>,
    <>
      {clientInitError && <Alert
          variant={"outlined"}
          color={"warning"}
      >{clientInitError}</Alert>}
      <Typography variant={'h4'}>Edit selected PRs ({selected.length})</Typography>
      <FormControl fullWidth>
        <FormHelperText>Title</FormHelperText>
        <MemorableTextField
          memProps={{
            megaFieldIdentifier: 'pullTitle',
            value: title,
            valueChange: setTitle,
          }}
          textProps={{
            fullWidth: true,
          }}
        />
      </FormControl>
      <FormControl fullWidth>
        <FormHelperText>Body</FormHelperText>
        <MemorableTextField
          memProps={{
            megaFieldIdentifier: 'pullBody',
            value: body,
            valueChange: setBody,
          }}
          textProps={{
            fullWidth: true,
            multiline: true,
            minRows: 5,
          }}
        />
      </FormControl>
    </>,
    action,
  )
}
