import React, {useCallback, useContext, useEffect, useState} from "react";
import {SearchFieldProps} from "../types";
import {Alert, Button, FormControl, FormHelperText, MenuItem, Select} from "@mui/material";
import {warn} from "tauri-plugin-log-api";
import {useSourceGraphClient} from "./SourceGraphClient";
import {MegaContext} from "../../../hooks/MegaContext";
import {MemorableTextField} from "../../components/MemorableTextField";

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
  }, [clientWrapper, props.searchFieldProps])

  const search = useCallback(() => {
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
  }, [clientWrapper, max, searchTerm])

  /*Render*/
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
      <MemorableTextField
        memProps={{
          value: searchTerm,
          valueChange: setSearchTerm,
          megaFieldIdentifier: 'sgSearchField',
          maxMemory:25,
          saveOnEnter: true,
          enterAction: search,
        }}
        textProps={{
          fullWidth: true,
          label: 'Search String',
          autoComplete: 'new-password',
        }}
      />
    </div>

    <Button
      variant={"contained"} color={"primary"}
      disabled={props?.searchFieldProps?.state !== 'ready' || searchTerm.length === 0}
      onClick={search}>Search</Button>
  </>;
}
