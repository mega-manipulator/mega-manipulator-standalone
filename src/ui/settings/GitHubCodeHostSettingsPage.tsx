import React, {useContext, useState} from "react";
import {MegaContext, MegaSettingsType} from "../../hooks/MegaContext";
import {Button} from "react-bootstrap";
import {warn} from "tauri-plugin-log-api";
import {SettingsPage} from "./SettingsPage";
import {confirm} from "@tauri-apps/api/dialog";
import {useMutableState} from "../../hooks/useMutableState";

export type CodeHostSettingsProps = {
  codeHostKey: string | undefined,
}

export const GitHubCodeHostSettingsPage: React.FC<CodeHostSettingsProps> = ({codeHostKey}) => {
  const context = useContext(MegaContext)
  const [codeHost, updateCodeHost] = useMutableState(codeHostKey ? context.settings.value.codeHosts[codeHostKey] : {})

  return <>
    {codeHostKey ? <>CodeHost: {codeHostKey} <Button variant={"danger"} onClick={() => {
      confirm('Delete?', codeHostKey).then((d) => {
        if (d) {
          warn('Deleting code host ' + codeHostKey)
          context.settings.update((settingsDraft) => {
            delete settingsDraft.codeHosts[codeHostKey]
          })
          context.navigatePage('Settings', <SettingsPage/>)
        }
      })
    }
    }>
      Delete
    </Button><br/></> : null}
    Json definition: {JSON.stringify(codeHost)}
    <div>
      <Button onClick={() => context.navigatePage('Settings', <SettingsPage/>)}>Back</Button>
    </div>
  </>
}
