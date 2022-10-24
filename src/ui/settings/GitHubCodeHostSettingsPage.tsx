import React from "react";
import {logWarn} from '../../hooks/logWrapper'
import {confirm} from "@tauri-apps/api/dialog";
import {Button} from "@mui/material";
import {useNavigate, useParams} from "react-router-dom";
import {useMutableMegaSettings} from "../../hooks/useMegaSettings";
import {locations} from "../route/locations";

export const GitHubCodeHostSettingsPage: React.FC = () => {
  const {codeHostKey} = useParams()
  const {megaSettings, updateMegaSettings} = useMutableMegaSettings()
  const nav = useNavigate()

  return <>
    {codeHostKey ? <>CodeHost: {codeHostKey} <Button color={"warning"} onClick={() => {
      confirm('Delete?', codeHostKey).then((d) => {
        if (d) {
          logWarn('Deleting code host ' + codeHostKey)
          updateMegaSettings((settingsDraft) => {
            delete settingsDraft.codeHosts[codeHostKey]
          });
          nav(locations.settings.link)
        }
      })
    }
    }>
      Delete
    </Button><br/></> : null}
    Json definition: JSON.stringify(codeHost)
    <div>
      <Button variant={"outlined"} color={"secondary"} onClick={() => nav(locations.settings.link)}>Back to
        Settings</Button>
    </div>
  </>
}
