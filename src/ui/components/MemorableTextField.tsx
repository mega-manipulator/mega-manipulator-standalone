import React, { useCallback, useEffect, useState } from 'react';
import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';
import { TextFieldProps } from '@mui/material/TextField/TextField';
import { debug, trace } from 'tauri-plugin-log-api';
import { asString } from '../../hooks/logWrapper';
import { Store } from 'tauri-plugin-store-api';

type InputProps = {
  megaFieldIdentifier: string;
  /**
   * Will default to 10
   */
  maxMemory?: number;
  /**
   * Will default to true
   */
  saveOnEnter?: boolean;
  enterAction?: (_: string) => void;

  value: string;
  valueChange: (
    // eslint-disable-next-line no-unused-vars
    v: string
  ) => void;
};

type CombinedProps = {
  memProps: InputProps;
  autoCompleteProps?: AutocompleteProps<string, false, true, true>;
  textProps?: TextFieldProps;
};

export const MemorableTextField: React.FC<CombinedProps> = ({ memProps, textProps }) => {
  const [vs, setVs] = useState<string[]>([memProps.value ?? '']);
  useEffect(() => {
    // On load
    (async () => {
      const store = new Store('.MemorableTextField.dat');
      const retrieved: string[] | null = await store.get(memProps.megaFieldIdentifier);
      if (retrieved !== null && retrieved != undefined) {
        memProps.valueChange(retrieved[0]);
        setVs(retrieved);
      }
    })();
  }, []);
  const internalEnterAction = useCallback(
    (newVal: string) => {
      let tmp = [...vs];
      tmp.unshift(newVal);
      tmp = tmp.filter((value, index, array) => value && value !== '' && array.indexOf(value) === index);
      tmp.splice(memProps.maxMemory ?? 10);
      setVs(tmp);

      const store = new Store('.MemorableTextField.dat');
      store
        .set(memProps.megaFieldIdentifier, tmp)
        .then(() => trace(`Updated ${memProps.megaFieldIdentifier} storage with [${tmp.join(',')}]`))
        .catch((e) => `Failed updating file store for MemorableTextField '${memProps.megaFieldIdentifier}': ${asString(e)}`);

      memProps.enterAction && memProps.enterAction(newVal);
    },
    [memProps, vs]
  );

  return (
    <Autocomplete
      freeSolo
      value={memProps.value}
      options={vs}
      renderInput={(params) => (
        <TextField
          {...params}
          {...textProps}
          value={memProps.value}
          onChange={(e) => {
            e.target.value && memProps.valueChange(e.target.value);
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const v = (e.target as unknown as any)?.value;
              if (typeof v === 'string') {
                debug('ENTER ' + v);
                memProps.valueChange(v);
                internalEnterAction(v);
              }
            }
          }}
        />
      )}
    />
  );
};
