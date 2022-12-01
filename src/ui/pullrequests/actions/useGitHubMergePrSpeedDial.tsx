import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {MegaContext} from "../../../hooks/MegaContext";
import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import CallMergeIcon from '@mui/icons-material/CallMerge';
import {useGitHubCodeClient} from "../../search/github/useGitHubSearchClient";
import {Alert, FormControlLabel, MenuItem, Select, Switch, TextField} from "@mui/material";
import {ConditionalSkeleton} from "../../ConditionalSkeleton";
import {GithubMergeMethodResponse, GitHubPull} from "../../../hooks/github.com";

const mergeAlternatives: { name: string, type: GithubMergeMethodResponse }[] = [
  {name: 'Squash', type: "SQUASH"},
  {name: 'Rebase', type: "REBASE"},
  {name: 'Merge', type: "MERGE"},
]

export function useGitHubMergePrSpeedDial() {
  const {pullRequests: {selected}} = useContext(MegaContext);
  const {ghClient, clientInitError} = useGitHubCodeClient();
  const [dropBranch, setDropBranch] = useState(true);
  const [customCommit, setCustomCommit] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [customMerge, setCustomMerge] = useState(false);
  const [merge, setMerge] = useState<GithubMergeMethodResponse>('SQUASH');
  useEffect(() => {
    setTitle(selected[0]?.title ?? '')
    setMessage(selected[0]?.title ?? '')
  }, [selected]);

  const action = useCallback(async (progress: (current: number, total: number) => void) => {
      progress(0, selected.length)
      if (ghClient) {
        return await ghClient.mergePullRequests({
          prs: selected,
          message: customCommit ? message : undefined,
          title: customCommit ? title : undefined,
          mergeStrategy: customMerge ? merge : undefined,
          dropBranch,
        }, (idx: number) => progress(idx, selected.length))
      }
      return {
        time: 0
      }
    },
    [selected, ghClient, customCommit, message, title, customMerge, merge, dropBranch],
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
  const prsThatAreAlreadyMerged = useMemo(() => selected.filter((s) => s && s.mergedAt), [selected]);
  const draftPrs = useMemo(() => selected.filter((s)=>s && s.draft), [selected]);
  // TODO * PRs that don't pass their checks

  return useGenericPrSpeedDialActionProps(
    'Merge Pull Requests',
    selected.length === 0,
    <CallMergeIcon/>,
    <>
      {clientInitError && <Alert variant={"outlined"} color={"warning"}>{clientInitError}</Alert>}
      {prsThatDontAllowSelectedMergeMethod.length > 0 && <Alert
          variant={"outlined"} color={"warning"}
      >{prsThatDontAllowSelectedMergeMethod.length} PRs does not allow {merge} merge method</Alert>}
      {prsThatAreAlreadyMerged.length > 0 && <Alert
          variant={"outlined"} color={"warning"}
      >{prsThatAreAlreadyMerged.length} PRs are already merged</Alert>}
      {draftPrs.length > 0 && <Alert
          variant={"outlined"} color={"warning"}
      >{draftPrs.length} PRs are merely drafts</Alert>}

      <div>
        <FormControlLabel
          control={<Switch checked={dropBranch} onClick={() => setDropBranch(!dropBranch)}/>}
          label={<>Drop branch after merge {dropBranch ? '🧨' : '🛟'}</>}/>
      </div>
      <FormControlLabel
        control={<Switch checked={customCommit} onClick={() => setCustomCommit(!customCommit)}/>}
        label={'Custom commit message'}/>
      <ConditionalSkeleton condition={customCommit}>
        <TextField
          label={'Commit title'}
          disabled={!customCommit}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label={'Commit message'}
          disabled={!customCommit}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </ConditionalSkeleton>
      <FormControlLabel
        control={<Switch checked={customMerge} onClick={() => setCustomMerge(!customMerge)}/>}
        label={'Use preferred merge strategy'}/>
      <ConditionalSkeleton condition={customMerge}>
        <Select
          disabled={!customMerge}
          value={merge}>
          {mergeAlternatives.map((v, i) => <MenuItem
            key={i}
            value={v.type}
            onClick={() => setMerge(v.type)}
          >{v.name}</MenuItem>)}
        </Select>
      </ConditionalSkeleton>
    </>,
    action,
  )
}
