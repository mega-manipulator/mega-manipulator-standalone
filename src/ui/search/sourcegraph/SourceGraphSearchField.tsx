import React, {useContext, useEffect, useState} from "react";
import {SearchFieldProps} from "../types";
import {Alert, Button, FormControl, FormHelperText, MenuItem, Select, TextField} from "@mui/material";
import {warn} from "tauri-plugin-log-api";
import {useSourceGraphClient} from "./SourceGraphClient";
import {MegaContext} from "../../../hooks/MegaContext";

export type SourceGraphSearchFieldProps = {
  readonly searchFieldProps: SearchFieldProps;
}

export const SourceGraphSearchField: React.FC<SourceGraphSearchFieldProps> = (props) => {
  const {search: {setHits: setSearchHits}} = useContext(MegaContext);
  const [searchTerm, setSearchTerm] = useState('repo:/mega-manipulator$ count:1');
  const [max, setMax] = useState(100)
  const clientWrapper = useSourceGraphClient(props)
  useEffect(() => {
    if (clientWrapper.client) {
      props.searchFieldProps.setState('ready')
    } else {
      props.searchFieldProps.setState('loading')
    }
  }, [clientWrapper])

  if (clientWrapper.error) {
    return <Alert severity={"warning"} variant={"filled"}>{clientWrapper.error}</Alert>
  }

  return <>
    <FormControl>
      <FormHelperText>Max hits</FormHelperText>
      <Select
        value={max}
        onChange={(event) => setMax(+event.target.value)}
      >
        {[10, 50, 100, 1000].map((i: number, idx) => <MenuItem key={idx} value={i}>{i}</MenuItem>)}
      </Select>
    </FormControl>

    <div>
      <TextField
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        fullWidth
        label={'Search String'}
        autoComplete={'new-password'}
      />
    </div>

    <Button
      variant={"contained"} color={"primary"}
      disabled={props?.searchFieldProps?.state !== 'ready' || searchTerm.length === 0}
      onClick={() => {
        if (clientWrapper.client) {
          setSearchHits([])
          props.searchFieldProps.setState('searching')
          clientWrapper.client.searchCode(searchTerm, max)
            .then((hits) => {
              setSearchHits(hits)
            })
            .finally(() => {
              props.searchFieldProps.setState('ready')
            })
        } else {
          warn('Search Client was undefined')
        }
      }}>Search</Button>
  </>;
}
