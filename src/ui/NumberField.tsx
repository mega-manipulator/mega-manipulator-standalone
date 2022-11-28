import React, {useEffect, useState} from "react";
import {TextField} from "@mui/material";
import {TextFieldProps} from "@mui/material/TextField/TextField";

type NumberFieldProps = {
  value: number,
  valueText: string,
  setValueText: (valueText: string) => void,
  error: boolean,
}

export function useNumberFieldProps(
  defaultValue: number,
  numberValidation: (n: number) => boolean,
): NumberFieldProps {
  const [value, setValue] = useState<number>(defaultValue);
  const [valueText, setValueText] = useState<string>(`${defaultValue}`);
  const [error, setError] = useState<boolean>(false);
  useEffect(() => {
    const number: number = +valueText;
    if (isNaN(number)) {
      setError(true)
    } else if (numberValidation(number)) {
      setError(false)
      setValue(number)
    } else {
      setError(true)
    }
  }, [valueText])
  return {
    value,
    valueText,
    setValueText,
    error,
  }
}

export const NumberField: React.FC<{ num: NumberFieldProps, text: TextFieldProps }> = ({num, text}) => {
  return <TextField
    {...text}
    value={num.valueText}
    onChange={(evt) => num.setValueText(evt.target.value)}
    onBlur={()=>num.setValueText(`${num.value}`)}
    error={num.error}
  />
}
