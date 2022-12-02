import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {Autocomplete, TextField} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {TextFieldProps} from "@mui/material/TextField/TextField";
import {trace} from "tauri-plugin-log-api";
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
  saveOnBlur?:boolean,
}
type Props = {
  megaFieldIdentifier: string,
  value: string,
  values: string[],
  setValue: (v: string) => void,
  saveCallback: (val:string) => void
  onBlur?: () => void
}

type MemorableTextFieldProps = Props & TextFieldProps

export function useMemorableTextField(inputProps: InputProps): Props {
  const {fieldMemory, setFieldMemory} = useContext(MegaContext);
  const [value, setValue] = useState<string>(inputProps.defaultValue ?? '');
  const values = useMemo(() => fieldMemory[inputProps.megaFieldIdentifier] ?? [], [fieldMemory]);
  useEffect(() => {
    if (values) {
      setValue(values[0] ?? inputProps.defaultValue)
      trace('Current values are: '+asString(values))
    }
  }, []);

  const saveCallback = useCallback(() => {
    if (fieldMemory) {
      let v:string[] | undefined = fieldMemory[inputProps.megaFieldIdentifier];
      if (v) {
        trace(`Adding value: '${value}'`)
        v.unshift(value)
        v = v.filter((value, index, array)=>array.indexOf(value) === index)
        v.splice(inputProps.maxMemory ?? 10)
        fieldMemory[inputProps.megaFieldIdentifier] = v
      } else {
        trace('Adding FIRST value')
        fieldMemory[inputProps.megaFieldIdentifier] = [value]
      }
      setFieldMemory({...fieldMemory})
    }
  }, [inputProps, value, inputProps.megaFieldIdentifier])
  const onBlur: undefined | (() => void) = inputProps.saveOnBlur ? saveCallback : undefined;
  return {
    ...inputProps,
    value,
    setValue,
    values,
    saveCallback,
    onBlur,
  }
}

/**
 *
 */
export const MemorableTextField: React.FC<MemorableTextFieldProps> = (props) => {
  return <Autocomplete
    freeSolo
    blurOnSelect
    onChange={(event, value, reason, details) => {
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
