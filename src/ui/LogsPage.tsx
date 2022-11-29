import {Avatar, Fade, Grid, Radio, Typography, useScrollTrigger} from "@mui/material";
import React, {useEffect, useRef, useState} from "react";
import {logDir} from "@tauri-apps/api/path";
import {fs, path} from "@tauri-apps/api";
import {debug, error} from "tauri-plugin-log-api";
import {asString} from "../hooks/logWrapper";
import {KeyboardDoubleArrowUpRounded} from "@mui/icons-material";

// type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE'

export const LogsPage: React.FC = () => {
  const bottomRef = useRef<HTMLSpanElement | null>(null)
  const topRef = useRef<HTMLSpanElement | null>(null)
  const trigger = useScrollTrigger({
    target: window,
    disableHysteresis: true,
    threshold: 100,
  });

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
  const [selectedLogFile, setSelectedLogFile] = useState<string>()
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
    setSelectedLogFile(undefined);
  }, [logFiles])
  const [logFileContent, setLogFileContent] = useState<string>();
  useEffect(() => {
    const refreshFileContent = (async () => {
      if (selectedLogFile) {
        try {
          const fullPath = await path.join(await logDir(), selectedLogFile)
          setLogFileContent(await fs.readTextFile(fullPath));
        } catch (e) {
          error(asString(e))
        }
      } else {
        setLogFileContent(undefined)
      }
    });
    refreshFileContent()
  }, [selectedLogFile]);


  return <>
    <span ref={topRef}/>
    <Typography variant={'h4'}>Logs</Typography>
    <Fade in={trigger} style={{position: "fixed", bottom: 10, right: 10}}>

      <Avatar onClick={() => {
        if (typeof topRef.current?.scrollIntoView === 'function') {
          debug('Scroll to top')
          topRef.current.scrollIntoView();
        } else {
          debug('topRef.current.scrollIntoView not set')
        }
      }}><KeyboardDoubleArrowUpRounded/></Avatar>
    </Fade>
    <Grid container width={'100%'}>

      {logFiles.map((f,i) => <Grid key={i} item style={{border: '1px solid #fff', paddingRight: 10, margin: 10}}>
        <Radio
          checked={f === selectedLogFile}
          name={`file-select_${f}`}
          value={f}
          inputProps={{'aria-label': f}}
          onClick={() => setSelectedLogFile(f)}
        />{f}
      </Grid>)}
    </Grid>

    <hr/>
    <div>
      <pre>
        {logFileContent !== null ? logFileContent :
          'Hello world, here I want to have the selected log file content'}
      </pre>
    </div>

    <span ref={bottomRef}>&nbsp;</span>
  </>
}
