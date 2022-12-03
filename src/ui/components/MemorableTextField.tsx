import React, {useCallback, useContext, useEffect, useState} from "react";
import {Autocomplete, TextField} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {TextFieldProps} from "@mui/material/TextField/TextField";
import {debug, trace} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";

type InputProps = {
  megaFieldIdentifier: string,
  /**
   * Default to empty string, will be used if there is no memory
   */
  defaultValue?: string,
  /**
   * Will default to 10
   */
  maxMemory?: number,
  /**
   * Will default to true
   */
  saveOnBlur?: boolean,
}
type Props = {
  megaFieldIdentifier: string,
  value: string,
  values: string[],
  setValue: (v: string) => void,
  saveCallback: () => void
  saveOnBlur: boolean
}

export type MemorableTextFieldProps = Props & TextFieldProps

export function useMemorableTextField(inputProps: InputProps): Props {
  inputProps.maxMemory = 1; // TODO remove OVERRIDE
  const {fieldMemory, setFieldMemory} = useContext(MegaContext);
  const [value, setValue] = useState<string>(inputProps.defaultValue ?? '');
  const [values, setValues]  = useState<string[]>([]); useEffect(() => {
    setValues(fieldMemory[inputProps.megaFieldIdentifier] ?? inputProps.defaultValue ? [inputProps.defaultValue ?? ''] : [])
  }, [fieldMemory]);
  useEffect(() => {
    if (values) {
      setValue(values[0] ?? inputProps.defaultValue ?? '')
      debug('Current values are: ' + asString(values))
    }
  }, [inputProps]);

  const saveCallback = useCallback(() => {
    if (fieldMemory) {
      let v: string[] | undefined = fieldMemory[inputProps.megaFieldIdentifier];
      if (v) {
        debug(`Adding value: '${value}'`)
        v.unshift(value)
        v = v.filter((value, index, array) => array.indexOf(value) === index)
        v.splice(inputProps.maxMemory ?? 10)
        fieldMemory[inputProps.megaFieldIdentifier] = v
        setValues(v)
      } else {
        trace('Adding FIRST value')
        fieldMemory[inputProps.megaFieldIdentifier] = [value]
        setValues([value])
      }
      setFieldMemory({...fieldMemory})
    }
  }, [inputProps, value, inputProps.megaFieldIdentifier])
  return {
    ...inputProps,
    value,
    setValue,
    values,
    saveCallback,
    saveOnBlur: inputProps.saveOnBlur ?? true,
  }
}

/**
 *
 */
export const MemorableTextField: React.FC<MemorableTextFieldProps> = (props) => {
  return <Autocomplete
    freeSolo
    blurOnSelect
    onBlur={() => {
      props.saveOnBlur && props.saveCallback()
    }}
    onInputChange={(event, f) => f && props.setValue(f)}
    onChange={(event, value, reason) => {
      trace(`Value changed 😱 to '${value}' because of '${reason}'`)
      value && props.setValue(value)
    }}
    renderInput={(params) => <TextField
      onChange={(event) => props.setValue(event.target.value)}
      {...props}
      {...params}
    />}
    options={props.values}/>

}
