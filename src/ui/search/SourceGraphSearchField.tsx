import React, {useEffect, useState} from "react";
import {SearchFieldProps} from "./types";
import {Button, FormControl, FormHelperText, MenuItem, Select, TextField, Typography} from "@mui/material";
import {info, warn} from "tauri-plugin-log-api";
import {SourceGraphSearchHandle, useSourceGraphClient} from "./SourceGraphClient";
import {asString} from "../../hooks/logWrapper";

export type SourceGraphSearchFieldProps = {
  readonly searchFieldProps: SearchFieldProps;
}

export const SourceGraphSearchField: React.FC<SourceGraphSearchFieldProps> = (props) => {
  const [searchText, setSearchText] = useState('tauri count:all select:repo')
  const [max, setMax] = useState(100)
  const clientWrapper = useSourceGraphClient(props)
  useEffect(() => {
    if (clientWrapper.client) {
      props.searchFieldProps.setState('ready')
    } else {
      props.searchFieldProps.setState('loading')
    }
  }, [clientWrapper])
  const [searchHandle, setSearchHandle] = useState<SourceGraphSearchHandle>()


  return <>
    <FormControl>
      <FormHelperText>Max hits</FormHelperText>
      <Select
        value={max}
        onChange={(event) => setMax(+event.target.value)}
      >
        {[10, 50, 100, 1000].map((i: number) => <MenuItem value={i}>{i}</MenuItem>)}
      </Select>
    </FormControl>

    <Button
      variant={"contained"} color={"primary"}
      disabled={props?.searchFieldProps?.state !== 'ready' || searchText.length === 0}
      onClick={() => {
        searchHandle?.cancel()
        if (clientWrapper.client) {
          setSearchHandle(clientWrapper.client.searchCode(searchText,max))
        } else {
          warn('Search Client was undefined')
        }
        info('Clicked')
      }}>Search</Button>

    <TextField
      InputLabelProps={{shrink: true}}
      label={'Search String'}
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
    />
    {searchHandle && <Typography>asString(searchHandle)</Typography>}
  </>
}
