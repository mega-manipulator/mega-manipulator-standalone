import {useGenericSpeedDialActionProps} from "../../components/speeddial/GenericSpeedDialAction";
import {MegaContext} from "../../../hooks/MegaContext";
import {useCallback, useContext, useState} from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {MenuItem, Select} from "@mui/material";
import {open} from "@tauri-apps/api/shell";
import {warn} from "tauri-plugin-log-api";

type openType = 'repos' | 'prs' | 'diffs'

export function useGitHubOpenPrInBrowserSpeedDial() {
  const {pullRequests: {selected}} = useContext(MegaContext);
  const [type, setType] = useState<openType>("diffs")
  const action = useCallback(async (progress: (_current: number, _total: number) => void) => {
    progress(0, selected.length)
    selected.forEach((s) => {
      switch (type) {
        case "repos":
          open(s.repositoryUrl)
          break;
        case "prs":
          open(s.htmlUrl)
          break;
        case "diffs":
          open(`${s.htmlUrl}/files`)
          break;

      }
    })
    progress(selected.length, selected.length)
    return ({time: 0})
  }, [selected, type])
  return useGenericSpeedDialActionProps(
    'Open selected Pull Requests in browser',
    selected.length === 0,
    <OpenInNewIcon/>,
    <>
      <Select value={type} onChange={(event) => {
        try {
          setType(event.target.value as unknown as openType)
        } catch (e) {
          warn('Failed to set the menu option')
        }
      }}>
        <MenuItem value={'repos'}>Open Repos</MenuItem>
        <MenuItem value={"prs"}>Open PRS</MenuItem>
        <MenuItem value={"diffs"}>Open PR diffs</MenuItem>
      </Select>
    </>,
    action,
  )
}
