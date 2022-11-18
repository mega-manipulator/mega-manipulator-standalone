import React, {useContext, useState} from "react";
import {WizardComponent} from "../wizard/WizardComponent";
import {FormControlLabel, ListItemButton, Switch, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {runScriptInParallel, runScriptSequentially} from "../../service/file/scriptFile";
import {StageView} from "./StageView";

export const MakeChangesWizard: React.FC = () => {
  // Wizard
  const {settings, clones: {selected}} = useContext(MegaContext);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Change
  const [runMode, setRunMode] = useState<'sequential' | 'parallel'>('sequential');

  return <>
    <ListItemButton
      onClick={() => setIsOpen(!isOpen)}
    >Change Wizard</ListItemButton>
    <WizardComponent
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      steps={[
        // Change
        {
          name: 'Run Change Script',
          description: <>
            <Typography>Run Scripted Change on {selected.length} projects</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={runMode === 'parallel'}
                  onClick={() => setRunMode(runMode === 'parallel' ? 'sequential' : "parallel")}
                />
              }
              label={runMode}
            />
          </>,
          action: () => {
            switch (runMode) {
              case "parallel":
                return runScriptInParallel({settings, filePaths: selected})
              case "sequential":
                return runScriptSequentially({settings, filePaths: selected})
            }
          }
        },
        // Stage
        {
          name: 'Stage',
          description: <StageView/>,
        },

        // Commit
        {
          name: 'Commit',
          description: <></>,
        },

        // Push
        {
          name: 'Push',
          description: <></>,
        },

        // Pull request
        {
          name: 'Pull Request',
          description: <></>,
        }
      ]}
    />
  </>
};
