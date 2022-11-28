import React, {useContext, useState} from "react";
import {WizardComponent} from "../wizard/WizardComponent";
import {FormControlLabel, IconButton, ListItemButton, Switch, Tooltip, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {runScriptInParallel, runScriptSequentially, scriptFile} from "../../service/file/scriptFile";
import {StageView} from "./StageView";
import {open} from "@tauri-apps/api/shell";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import {path} from "@tauri-apps/api";
import {CommitView} from "./CommitView";
import {PushView} from "./PushView";
import {PullRequestView} from "./PullRequestView";

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
            <Typography>Run Scripted Change on {selected.length} projects?</Typography>
            <Typography>The script will execute in the root of every project folder, and can be run in sequence or in parallel.</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={runMode === 'parallel'}
                  onClick={() => setRunMode(runMode === 'parallel' ? 'sequential' : "parallel")}
                />
              }
              label={runMode}
            />
            <Tooltip title={'Open change-script'}><IconButton
              onClick={() => path.join(settings.clonePath, scriptFile).then((file) => open(file))}
            ><FileOpenIcon/></IconButton></Tooltip>
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
          description: <CommitView/>,
        },

        // Push
        {
          name: 'Push',
          description: <PushView/>,
        },

        // Pull request
        {
          name: 'Pull Request',
          description: <PullRequestView/>,
        }
      ]}
    />
  </>
};