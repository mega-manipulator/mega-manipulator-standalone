import React, {useCallback, useContext} from "react";
import {MegaContext} from "../../../hooks/MegaContext";
import {SpeedDialAction} from "@mui/material";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {open} from '@tauri-apps/api/shell';

export const GitHubPrOpenInBrowserSpeedDial: React.FC = () => {
  const {pullRequests: {selected}} = useContext(MegaContext)
  const action = useCallback(() => {
    for (let i = 0; i < selected.length; i++) {
      open(selected[i].htmlUrl)
    }
  }, [selected])

  // Render
  if (selected.length === 0)
    return null
  else
    return <SpeedDialAction
      icon={<OpenInNewIcon/>}
      tooltipTitle={'Open selected Pull Requests in browser'}
      onClick={() => action()}
    />;
};
