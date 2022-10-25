import {Radio, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {logDir} from "@tauri-apps/api/path";
import {fs} from "@tauri-apps/api";

export const LogsPage: React.FC = () => {
  const [logFiles, setLogFiles] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      const dir = await logDir()
      const files = await fs.readDir(dir)
      const logFiles = files.filter((it) => it.children === undefined)
        .map((it) => it.path.substring(dir.length))
      setLogFiles(logFiles)
    })()
  }, [])
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null)
  useEffect(() => {
    // Reset the selected logFile when the files change, for any reason
    if (logFiles.length > 0) {
      if (selectedLogFile !== null && logFiles.some((f) => f === selectedLogFile)) {
        // Do nothing
        return;
      } else {
        setSelectedLogFile(logFiles[0])
        return;
      }
    }
    setSelectedLogFile(null);
  }, [logFiles])
  const [logFileContent, setLogFileContent] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      if (selectedLogFile !== null) {

      }
    })();
  }, [selectedLogFile]);
  return <>
    <Typography variant={'h4'}>Logs</Typography>
    <div>
      {logFiles.map((f) => <div>
        <Radio
          checked={f === selectedLogFile}
          name={`file-select_${f}`}
          value={f}
          inputProps={{'aria-label': f}}
          onClick={() => setSelectedLogFile(f)}
        />
      </div>)}
      <code>
        Hello world, here I want to have the selected log file content
      </code>
    </div>
  </>
}
