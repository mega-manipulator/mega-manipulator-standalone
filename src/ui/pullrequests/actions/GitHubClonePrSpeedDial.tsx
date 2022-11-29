import React, {useCallback, useContext} from "react";
import {MegaContext} from "../../../hooks/MegaContext";
import {useGenericPrSpeedDialActionProps} from "./GenericPrSpeedDialAction";
import {Alert, Tooltip, Typography} from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import {SearchHit} from "../../search/types";
import {GitHubPull} from "../../../hooks/github.com";
import {open} from "@tauri-apps/api/shell";


export function useGitHubClonePrSpeedDial(setCloneModalOpen: (isOpen: boolean) => void) {
  const {
    settings,
    pullRequests: {selected: selectedPulls},
    code: {codeHostKey},
    search: {setHits, setSelected: setSelectedSearchHits}
  } = useContext(MegaContext);
  const action = useCallback(async (progressCallback: (current: number, total: number) => void) => {
    progressCallback(0, selectedPulls.length)
    const hits: SearchHit[] = selectedPulls.map((pr) => ({
      searchHost: codeHostKey,
      codeHost: codeHostKey,
      owner: pr.owner.login,
      repo: pr.repo,
      sshClone: pr.cloneUrl,
      description: pr.title,
      branch: pr.head,
    }));
    setHits(hits)
    setSelectedSearchHits(hits.map((_, i) => i))
    setCloneModalOpen(true)
    return {time: 0}
  }, [selectedPulls, settings])

  return useGenericPrSpeedDialActionProps(
    'Clone selected Pull requests',
    selectedPulls.length === 0,
    <CloudDownloadIcon/>,
    <>
      <CloneAlerts pulls={selectedPulls}/>
      <Typography>Open clone window, to clone {selectedPulls.length} pulls?</Typography>
    </>,
    action
  )
}

const CloneAlerts: React.FC<{ pulls: GitHubPull[] }> = ({pulls}) => {

  const uniqueBranches = pulls.map((s) => s?.head)
    .filter((head, idx, self) => head !== undefined && self.indexOf(head) === idx);
  const repos = pulls.filter((p) => p).map((p) => `${p.codeHostKey}/${p.owner.login}/${p.repo}`).sort();
  const reducedRepos = repos.reduce((previousValue, currentValue) => {
    if (previousValue[currentValue] !== undefined) {
      previousValue[currentValue] = previousValue[currentValue] + 1
    } else {
      previousValue[currentValue] = 1
    }
    return previousValue;
  }, {} as { [key: string]: number })
  const duplicateRepos = Object.keys(reducedRepos).map((key) => ({repo: key, count: reducedRepos[key]}))
    .filter((r) => r.count !== 1)
  const headless: GitHubPull[] = pulls.filter((s) => s !== undefined && s.head === undefined);
  const closed: GitHubPull[] = pulls.filter((s) => s !== undefined && s.state === 'CLOSED');
  return <>
    { // Branch deviation
      uniqueBranches.length > 1 && <Alert
            variant={"outlined"} color={"warning"}
        >{self.length} different branch names 😅</Alert>}
    {
      uniqueBranches.length === 1 && <Alert
            color={"success"} variant={"outlined"}
        >&quot;{uniqueBranches[0]}&quot; will be cloned from {pulls.length} pulls/repos</Alert>}

    { // Duplicate repos
      duplicateRepos.length < 5 && duplicateRepos.map((d,idx) => <Alert
        key={idx} variant={"filled"} color={"error"}
      >{d.count} pulls are from {d.repo}</Alert>)}
    {
      duplicateRepos.length >= 5 && <Alert
            variant={"filled"} color={"error"}
        >{duplicateRepos.reduce((prev, next) => prev + next.count, 0)} pulls are from the
            same {duplicateRepos.length} repos</Alert>}


    { // Headless
      headless.length !== 0 && <Tooltip
            title={'Click me to open those in browser, where you can restore the branches, then redo the search here'}>
            <Alert
                onClick={() => headless.forEach((h) => open(h.htmlUrl))}
                variant={"filled"} color={"error"}
            >{headless.length} pulls are from Headless</Alert>
        </Tooltip>}

    { // Closed PRs
      closed.length !== 0 && <Alert color={"warning"} variant={"outlined"}
        >{closed.length} of the selected PRs are already Closed 🤦</Alert>
    }
  </>
}
