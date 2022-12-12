import {useCallback, useContext, useState} from "react";
import {FormControl, FormHelperText} from "@mui/material";
import {gitCommit} from "../../service/file/gitCommit";
import {MegaContext} from "../../hooks/MegaContext";
import {ProgressReporter} from "../../service/types";
import {MemorableTextField} from "../components/MemorableTextField";
import {
  GenericSpeedDialActionProps,
  useGenericSpeedDialActionProps
} from "../components/speeddial/GenericSpeedDialAction";

export function useCommitView(): GenericSpeedDialActionProps {
  const {clones: {selected}, settings} = useContext(MegaContext);

  const [commitMessage, setCommitMessage] = useState('');
  const trigger = useCallback(async (progress: ProgressReporter) => {
    const n = await gitCommit({
      hits: selected,
      settings,
      commitMessage,
      sourceString: `Commit to ${selected.length} repos`,
      workResultKind: 'gitCommit',
      progress,
    });
    return {time: n};
  }, [selected, settings, commitMessage]);

  return useGenericSpeedDialActionProps(
    'Commit changes',
    selected.length === 0,
    <></>, // TODO
    <>
      <div>
        <FormControl fullWidth>
          <FormHelperText>Commit message</FormHelperText>
          <MemorableTextField
            textProps={{
              minRows: 5,
              fullWidth: true,
              placeholder: 'Made some improvements to the flux capacitor',
            }}
            memProps={{
              megaFieldIdentifier: 'commitMessageField',
              value: commitMessage,
              valueChange: setCommitMessage,
            }}
          />
        </FormControl>
      </div>
    </>,
    trigger,
    undefined,
  );
}
