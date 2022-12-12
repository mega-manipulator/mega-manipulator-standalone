import {Alert, Box, Button, LinearProgress, Modal, Step, StepButton, Stepper} from "@mui/material";
import {modalStyle} from "../modal/megaModal";
import React, {useCallback, useState} from "react";
import {ProgressReporter, WorkResultStatus} from "../../service/types";
import {asString} from "../../hooks/logWrapper";
import {ButtonRow} from "../components/ButtonRow";

type WizardStepProps = {
  name: string,
  description: JSX.Element,
  action?: (progress:ProgressReporter) => Promise<WorkResultStatus>,
}

type WizardComponentProps = {
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
  currentStep: number,
  setCurrentStep: (currentStep: number) => void,
  steps: WizardStepProps[],
}

export const WizardComponent: React.FC<WizardComponentProps> = (props) => {
  const [status, setStatus] = useState<WorkResultStatus | 'ready'>('ready');
  const [err, setErr] = useState<string>()
  const [progressTotal, setProgressTotal] = useState<number | null>(null);
  const [progressCurrent, setProgressCurrent] = useState<number | null>(null);
  const progressReporter:ProgressReporter = useCallback((current, total)=>{
    setProgressTotal(total)
    setProgressCurrent(current)
  },[]);
  const setStep = useCallback((step: number) => {
    if (step < (props.steps.length - 1)) {
      props.setCurrentStep(step)
    }
  }, [props]);
  const closeCallback = useCallback(() => {
    if (status !== "in-progress") {
      setStatus('ready')
      setErr(undefined)
      props.setIsOpen(false)

    }
  }, [props, status]);

  return <Modal open={props.isOpen} onClose={closeCallback}>
    <Box sx={modalStyle}>
      {/* ERRORS */}
      <div>
        {err && <Alert color={"error"} variant={"filled"}>{err}</Alert>}
      </div>

      {/* STEPPER */}
      <div>
        <Stepper nonLinear activeStep={props.currentStep}>
          {props.steps.map((s, i) => <Step key={i}>
            <StepButton onClick={() => {
              if (status !== "in-progress") {
                props.setCurrentStep(i)
              }
            }}>{s.name}</StepButton>
          </Step>)}
        </Stepper>
      </div>

      <hr/>

      {/* PROGRESS */}
      {progressCurrent && progressTotal && <div><Box width={"100%"}>
          <LinearProgress value={progressCurrent / progressTotal * 100.0} variant={"determinate"}/> {progressCurrent} / {progressTotal}
      </Box></div>}

      {/* STEP CONTENT */}
      <div>
        {props.steps[props.currentStep].description}
      </div>

      {/* BUTTONS */}
      <ButtonRow>
        <Button
          disabled={status === 'in-progress'}
          variant={"outlined"}
          color={"secondary"}
          onClick={closeCallback}
        >Cancel</Button>
        {props.steps[props.currentStep].action && <Button
            disabled={status !== 'ready'}
            variant={"contained"}
            color={"error"}
            onClick={() => {
              const action = props.steps[props.currentStep].action;
              if (action) {
                setStatus("in-progress")
                action(progressReporter)
                  .then((s) => setStatus(s))
                  .catch((e) => {
                    setStatus("failed")
                    setErr('Action Failed' + asString(e))
                  })
              }
            }}
        >Run</Button>}
        <Button
          disabled={status === 'in-progress'}
          variant={"contained"}
          color={status === "failed" ? "error" : "warning"}
          onClick={() => setStep(props.currentStep + 1)}
        >{status === 'ready' ? 'Skip' : 'Next'}</Button>
      </ButtonRow>
    </Box>
  </Modal>
}
