import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {MegaContext} from "../../../hooks/MegaContext";
import React, {useCallback, useContext, useMemo, useState} from "react";
import CallMergeIcon from '@mui/icons-material/CallMerge';
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {Alert, FormControlLabel, MenuItem, Select, Switch, TextField} from "@mui/material";
import {ConditionalSkeleton} from "../../ConditionalSkeleton";
import {GithubMergeMethods, GitHubPull} from "../../../hooks/github.com";

const mergeAlternatives: { name: string, type: GithubMergeMethods }[] = [
  {name: 'Squash', type: "SQUASH"},
  {name: 'Rebase', type: "REBASE"},
  {name: 'Merge', type: "MERGE"},
]

export function useGitHubMergePrSpeedDial() {
  const {pullRequests: {selected}} = useContext(MegaContext);
  const {ghClient, clientInitError} = useGitHubCodeClient();
  const [customCommit, setCustomCommit] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [customMerge, setCustomMerge] = useState(false);
  const [merge, setMerge] = useState<GithubMergeMethods>('SQUASH');
  const action = useCallback(async (progress: (current: number, total: number) => void) => {
      progress(0, selected.length)
      if (ghClient) {
        return await ghClient.mergePullRequests({
          prs: selected,
          message: customCommit ? message : undefined,
          title: customCommit ? title : undefined,
          mergeStrategy: customMerge ? merge : undefined,
        }, (idx: number) => progress(idx, selected.length))
      }
      // TODO: Do the merging
      return {
        time: 0
      }
    },
    [selected],
  );

  // == Check that all checks are met ==
  // * PRs that do not allow selected merge method
  const prsThatDontAllowSelectedMergeMethod: GitHubPull[] = useMemo(() => {
    if (customMerge) {
      switch (merge) {
        case "SQUASH":
          return selected.filter((s) => !s.merge.squashMergeAllowed)
        case "MERGE":
          return selected.filter((s) => !s.merge.mergeCommitAllowed)
        case "REBASE":
          return selected.filter((s) => !s.merge.rebaseMergeAllowed)
      }
    }
    return []
  }, [selected])
  // * PRs that are already merged
  const prsThatAreAlreadyMerged = useMemo(() => selected.filter((s) => s.mergedAt), [selected]);
  // TODO * PRs that don't pass their checks

  return useGenericPrSpeedDialActionProps(
    'Merge Pull Requests',
    selected.length !== 0,
    <CallMergeIcon/>,
    <>
      {clientInitError && <Alert variant={"outlined"} color={"warning"}>{clientInitError}</Alert>}
      {prsThatDontAllowSelectedMergeMethod.length > 0 && <Alert
          variant={"outlined"} color={"warning"}
      >{prsThatDontAllowSelectedMergeMethod.length} PRs does not allow {merge} merge method</Alert>}
      {prsThatAreAlreadyMerged.length > 0 && <Alert
          variant={"outlined"} color={"warning"}
      >{prsThatAreAlreadyMerged.length} PRs are already merged</Alert>}

      <FormControlLabel
        control={<Switch value={customCommit} onClick={() => setCustomCommit(!customCommit)}/>}
        label={'Custom commit message'}/>
      <ConditionalSkeleton condition={customCommit}>
        <TextField
          label={'Commit title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label={'Commit message'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </ConditionalSkeleton>
      <FormControlLabel
        control={<Switch value={customMerge} onClick={() => setCustomMerge(!customMerge)}/>}
        label={'Use prefered merge strategy'}/>
      <ConditionalSkeleton condition={customMerge}>
        <Select value={merge}>
          {mergeAlternatives.map((v, i) => <MenuItem
            key={i}
            value={v.type}
            onSelect={() => setMerge(v.type)}
          >{v.name}</MenuItem>)}
        </Select>
      </ConditionalSkeleton>
    </>,
    action,
  )
}
