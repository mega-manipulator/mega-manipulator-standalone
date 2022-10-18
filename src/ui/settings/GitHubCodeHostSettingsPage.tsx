import React from "react";
import {logWarn} from '../../hooks/logWrapper'
import {confirm} from "@tauri-apps/api/dialog";
import {useMutableState} from "../../hooks/useMutableState";
import {Button} from "@mui/material";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useMutableMegaSettings} from "../../hooks/useMegaSettings";
import {AppMenu} from "../menu/Menu";
import {locations} from "../route/locations";

export const GitHubCodeHostSettingsPage: React.FC = () => {
  const {codeHostKey} = useParams()
  const {megaSettings, updateMegaSettings} = useMutableMegaSettings()
  const [codeHost, updateCodeHost] = useMutableState(codeHostKey ? megaSettings.codeHosts[codeHostKey] : {})
  const nav = useNavigate()

  return <>
    <AppMenu/>
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
    Json definition: {JSON.stringify(codeHost)}
    <div>
      <Link to={'/settings'}>Back to Settings</Link>
    </div>
  </>
}
