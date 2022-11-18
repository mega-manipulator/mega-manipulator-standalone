import {Alert, Box, Button, Modal, Step, StepButton, Stepper} from "@mui/material";
import {modalStyle} from "../modal/megaModal";
import React, {useCallback, useState} from "react";
import {WorkResultStatus} from "../../service/types";
import {asString} from "../../hooks/logWrapper";

type WizardStepProps = {
  name: string,
  description: JSX.Element,
  action?: () => Promise<WorkResultStatus>,
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
  const closeCallback = useCallback(() => {
    if (status !== "in-progress") {
      setStatus('ready')
      setErr(undefined)
      props.setIsOpen(false)
    }
  }, []);

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
            <StepButton onClick={()=>{
              if (status !== "in-progress"){
                props.setCurrentStep(i)
              }
            }}>{s.name}</StepButton>
          </Step>)}
        </Stepper>
      </div>

      <hr/>

      {/* STEP CONTENT */}
      <div>
        {props.steps[props.currentStep].description}
      </div>

      {/* BUTTONS */}
      <p style={{
        display: "grid",
        gridAutoFlow: "column",
        gridColumnGap: '10px',
      }}>
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
            if(action) {
              setStatus("in-progress")
              action()
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
          onClick={() => {
            if (props.currentStep < (props.steps.length -1)) {
              props.setCurrentStep(props.currentStep + 1)
            }
          }}
        >{status === 'ready' ? 'Skip' : 'Next'}</Button>
      </p>
    </Box>
  </Modal>
}
