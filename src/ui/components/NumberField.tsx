import React, { useState } from 'react';
import { TextField } from '@mui/material';
import { TextFieldProps } from '@mui/material/TextField/TextField';

export type NumberFieldProps = {
  value: number;
  setValue: (_value: number) => void;
  numberValidation?: (_n: number) => boolean;
};

export const NumberField: React.FC<{
  num: NumberFieldProps;
  text?: TextFieldProps;
}> = ({ num, text }) => {
  const [valueText, setValueText] = useState<string>(`${num.value}`);
  const [error, setError] = useState<boolean>(false);
  return (
    <TextField
      {...text}
      value={valueText}
      onChange={(evt) => {
        const valueText = evt.target.value;
        setValueText(valueText);
        const number: number = +valueText;
        if (isNaN(number)) {
          setError(true);
        } else if (!num.numberValidation) {
          setError(false);
          num.setValue(number);
        } else if (num.numberValidation(number)) {
          setError(false);
          num.setValue(number);
        } else {
          setError(true);
        }
      }}
      onBlur={() => {
        setValueText(`${num.value}`);
        setError(false);
      }}
      error={error}
    />
  );
};
