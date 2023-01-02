import {useCallback, useContext, useEffect, useState} from "react";
import {Alert, FormControl, FormHelperText, Typography} from "@mui/material";
import {MegaContext} from "../../../hooks/MegaContext";
import {pathToSearchHit} from "../../../service/file/cloneDir";
import {SearchHit} from "../../search/types";
import {asString} from "../../../hooks/logWrapper";
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {debug, error} from "tauri-plugin-log-api";
import {MemorableTextField} from "../../components/MemorableTextField";
import {
  GenericSpeedDialActionProps,
  useGenericSpeedDialActionProps
} from "../../components/speeddial/GenericSpeedDialAction";
import {ProgressReporter} from "../../../service/types";
import UnfoldLessDoubleIcon from '@mui/icons-material/UnfoldLessDouble';

export function useCreatePullRequestView(): GenericSpeedDialActionProps {
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');

  const {clones: {selected}, code: {setCodeHostKey}} = useContext(MegaContext);
  const [hits, setHits] = useState<SearchHit[]>();
  const {ghClient, clientInitError} = useGitHubCodeClient()
  useEffect(() => {
    const codeHostKeySet = new Set(hits?.map((h) => h.codeHost));
    if (hits && codeHostKeySet.size === 1) {
      setCodeHostKey(hits[0]?.codeHost)
    }
  }, [hits, setCodeHostKey]);
  useEffect(() => {
    if (!selected) {
      setHits(undefined)
    } else {
      Promise.all(selected.map((s) => pathToSearchHit('local', s)))
        .then((hits) => setHits(hits))
        .catch((e) => error(asString(e)))
    }
  }, [selected]);
  const action = useCallback(async (progress: ProgressReporter) => {
    if (!title || title.length === 0) {
      throw new Error('PR Title not set')
    }
    if (!body || body.length === 0) {
      throw new Error('PR Body not set')
    }
    if (hits && ghClient) {
      return await ghClient.createPullRequests({title, body, hits}, (i) => {
        debug(`Made progress: ${i}`)
        progress(i, hits.length)
      })
    } else {
      return {time: 0}
    }
  }, [title, body, hits, ghClient])

  return useGenericSpeedDialActionProps(
    'Create Pull Request',
    selected.length === 0,
    <UnfoldLessDoubleIcon/>,
    selected.length === 0 ? <Alert color={'warning'} variant={'outlined'}>No Clones selected</Alert> :
      clientInitError ? <Alert
        color={"error"}
        variant={"filled"}
      >{clientInitError}</Alert> : <>
        <Typography variant={'h4'}>Create Pull Request</Typography>
        <div>
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
                placeholder: 'Title',
              }}
            />
          </FormControl>
        </div>
        <div>
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
                minRows: 3,
                placeholder: "Body",
              }}
            />
          </FormControl>
        </div>
      </>,
    action,
  )
}
