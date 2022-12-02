import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {Autocomplete, TextField} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {TextFieldProps} from "@mui/material/TextField/TextField";

type InputProps = {
  megaFieldIdentifier: string,
  defaultValue: string,
  maxMemory: number,
}
type Props = {
  megaFieldIdentifier: string,
  value: string,
  values: string[],
  setValue: (v: string) => void,
  saveCallback: () => void
}

type MemorableTextFieldProps = Props & TextFieldProps

export function useMemorableTextField(inputProps: InputProps): Props {
  const {fieldMemory, setFieldMemory} = useContext(MegaContext);
  const [value, setValue] = useState<string>(inputProps.defaultValue);
  const values = useMemo(() => fieldMemory[inputProps.megaFieldIdentifier] ?? [], [fieldMemory]);
  useEffect(() => {
    if (values) {
      setValue(values[0] ?? inputProps.defaultValue)
    }
  }, [values]);

  const saveCallback = useCallback(() => {
    if (fieldMemory) {
      if (fieldMemory[inputProps.megaFieldIdentifier]) {
        fieldMemory[inputProps.megaFieldIdentifier] = [value, ...fieldMemory[inputProps.megaFieldIdentifier]]
        fieldMemory[inputProps.megaFieldIdentifier].splice(inputProps.maxMemory)
      } else {
        fieldMemory[inputProps.megaFieldIdentifier] = [value]
      }
      setFieldMemory(fieldMemory)
    }
  }, [inputProps, value, inputProps.megaFieldIdentifier])
  return {
    ...inputProps,
    value,
    setValue,
    values: fieldMemory[inputProps.megaFieldIdentifier] ?? [],
    saveCallback,
  }
}

export const MemorableTextField: React.FC<MemorableTextFieldProps> = (props) => {
  return <Autocomplete
    renderInput={(params) => <TextField
      onChange={(event) => props.setValue(event.target.value)}
      {...props}
      {...params}
    />}
    options={props.values}/>

}
