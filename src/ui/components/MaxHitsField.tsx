import { FormControl, FormHelperText } from '@mui/material';
import { NumberField } from './NumberField';
import React from 'react';

export const MaxHitsField: React.FC<{
  value: number;
  setValue: (value: number) => void;
}> = ({ value, setValue }) => {
  return (
    <FormControl>
      <FormHelperText>Max hits</FormHelperText>
      <NumberField
        num={{
          value,
          setValue,
          numberValidation: (n) => n > 0,
        }}
        text={{ style: { width: '4em' } }}
      />
    </FormControl>
  );
};
