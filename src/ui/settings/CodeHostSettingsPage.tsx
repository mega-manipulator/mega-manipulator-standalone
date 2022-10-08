import React, {useContext, useEffect, useState} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {Button} from "react-bootstrap";
import {info, warn} from "tauri-plugin-log-api";

export type CodeHostSettingsProps = {
  codeHostKey: string | undefined,
}

export const CodeHostSettingsPage: React.FC<CodeHostSettingsProps> = ({codeHostKey}) => {
  const context = useContext(MegaContext)
  const [codeHost, setCodeHost] = useState(codeHostKey ? context.settings.value.codeHosts[codeHostKey] : {})
  useEffect(() => {
    info(`Entered CodeHostSettingsPage ${codeHostKey}`)
  })

  return <>
    {codeHostKey ? <>CodeHost: {codeHostKey} <Button variant={"danger"} onClick={() => {
      warn('Deleting code host ' + codeHostKey)
    }
    }>
      Delete
    </Button><br/></> : null}
    Json definition: {JSON.stringify(codeHost)}
  </>
}
