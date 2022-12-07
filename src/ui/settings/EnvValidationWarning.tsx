import React, {useEffect, useState} from "react";
import {Command, open} from "@tauri-apps/api/shell";
import {os} from "@tauri-apps/api";
import {Alert, Snackbar, Tooltip, Typography} from "@mui/material";

export const EnvValidationWarning: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    (async () => {
      const osType = await os.type()
      if (osType === "Darwin") {
        const commandResult = await new Command(
          "printenv-path",
          "PATH"
        ).execute();
        if (!commandResult.stdout.includes('/homebrew')) {
          setIsOpen(true)
        }
      }
    })()
  }, [])

  return <Snackbar open={isOpen} anchorOrigin={{vertical: "top", horizontal: "center"}}>
    <Alert
      variant={"filled"}
      color={"error"}
      onClose={() => setIsOpen(false)}
    >
      <Tooltip title={'Click to open a gist with some explaining of the possible problem'}>
        <Typography
          style={{cursor: "pointer"}}
          onClick={() => open('https://gist.github.com/rchurchley/cb8478caec1d1319abac')}
        >/homebrew not found on PATH</Typography>
      </Tooltip>
      <Typography variant={"caption"}>This could be a sign that you need to set your launcher path from your
        terminal</Typography>
      <Typography variant={"body2"}>
        <pre>sudo launchctl config user path $PATH</pre>
      </Typography>
    </Alert>
  </Snackbar>
}
