import React, {useCallback, useContext, useEffect, useState} from "react";
import {SearchFieldProps} from "../types";
import {Alert, Button, FormControl, FormHelperText} from "@mui/material";
import {warn} from "tauri-plugin-log-api";
import {useSourceGraphClient} from "./SourceGraphClient";
import {MegaContext} from "../../../hooks/MegaContext";
import {MemorableTextField} from "../../components/MemorableTextField";
import {NumberField} from "../../components/NumberField";

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
  }, [clientWrapper.client, max, props.searchFieldProps, searchTerm, setSearchHits])

  /*Render*/
  if (clientWrapper.error) {
    return <Alert severity={"warning"} variant={"filled"}>{clientWrapper.error}</Alert>
  }
  return <>
    <FormControl>
      <FormHelperText>Max hits</FormHelperText>
      <NumberField
        text={{style: {width:'4em'}}}
        num={{
          value: max,
          setValue: setMax,
        }}
      />
    </FormControl>

    <FormControl fullWidth>
      <FormHelperText>Search String</FormHelperText>
      <MemorableTextField
        memProps={{
          value: searchTerm,
          valueChange: setSearchTerm,
          megaFieldIdentifier: 'sgSearchField',
          maxMemory: 25,
          saveOnEnter: true,
          enterAction: search,
        }}
        textProps={{
          fullWidth: true,
          autoComplete: 'new-password',
        }}
      />
    </FormControl>

    <Button
      variant={"contained"} color={"primary"}
      disabled={props?.searchFieldProps?.state !== 'ready' || searchTerm.length === 0}
      onClick={search}>Search</Button>
  </>;
}
