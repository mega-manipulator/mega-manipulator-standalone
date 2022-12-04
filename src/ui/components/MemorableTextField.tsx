import React, {useCallback, useEffect, useState} from "react";
import {Autocomplete, AutocompleteProps, TextField} from "@mui/material";
import {TextFieldProps} from "@mui/material/TextField/TextField";
import {debug} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {Store} from "tauri-plugin-store-api";

type InputProps = {
  megaFieldIdentifier: string,
  /**
   * Will default to 10
   */
  maxMemory?: number,
  /**
   * Will default to true
   */
  saveOnEnter?: boolean,
  enterAction?: () => void,

  value: string,
  valueChange: (v: string) => void,
}

type CombinedProps = {
  memProps: InputProps
  autoCompleteProps?: AutocompleteProps<string, false, true, true>
  textProps?: TextFieldProps,
}

export const MemorableTextField: React.FC<CombinedProps> = ({memProps, textProps}) => {
  const [vs, setVs] = useState<string[]>([memProps.value ?? ''])
  useEffect(() => {
    // On load
    (async () => {
      const store = new Store('.MemorableTextField.dat');
      const retrieved: string[] | null = await store.get(memProps.megaFieldIdentifier)
      if (retrieved) {
        memProps.valueChange(retrieved[0])
      }
    })()
  }, []);
  const internalEnterAction = useCallback(() => {
    let tmp = vs;
    debug(`Adding value: '${memProps.value}'`)
    tmp.unshift(memProps.value)
    tmp = tmp.filter((value, index, array) => value && value !== '' && array.indexOf(value) === index)
    tmp.splice(memProps.maxMemory ?? 10)
    setVs(tmp)

    const store = new Store('.MemorableTextField.dat');
    store.set(memProps.megaFieldIdentifier, tmp)
      .then(() => debug(`Updated ${memProps.megaFieldIdentifier} storage with [${tmp.join(',')}]`))
      .catch((e) => `Failed updating file store for MemorableTextField '${memProps.megaFieldIdentifier}': ${asString(e)}`)

    memProps.enterAction && memProps.enterAction()
  }, [memProps.value]);

  return <Autocomplete
    freeSolo
    onInputChange={(event, f) => f && memProps.valueChange(f)}
    value={memProps.value}
    options={vs}
    onChange={(event, value) => {
      value && memProps.valueChange(value)
    }}
    onKeyUp={(e) => {
      if (e.key === 'Enter') {
        internalEnterAction()
      }
    }}
    renderInput={(params) => <TextField
      {...params}
      {...textProps}
    />}
  />

}
