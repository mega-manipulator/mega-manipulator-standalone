import React, {useEffect, useState} from "react";
import {Command} from "@tauri-apps/api/shell";

export const EnvValidationWarning:React.FC = () => {
  const [env, setEnv] = useState('')
  useEffect(() => {
    new Command(
      "print-env",
      "PATH"
    ).execute()
      .then((commandResult) => setEnv(commandResult.stdout))
  })

  // TODO: Recommend running script in terminal, and restart
  // sudo launchctl config user path $PATH

  return <>
    <ul>
      {
        env.split(':').map((it, index) => <li key={index}>{it}</li>)
      }
    </ul>
  </>
}
