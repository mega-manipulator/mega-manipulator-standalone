import {Alert, Box, Button, LinearProgress, Step, StepButton, Stepper} from "@mui/material";
import React, {useCallback, useState} from "react";
import {ProgressReporter, WorkResultStatus} from "../../service/types";
import {asString} from "../../hooks/logWrapper";
import {ButtonRow} from "../components/ButtonRow";
import {
  GenericSpeedDialActionProps,
  useGenericSpeedDialActionProps
} from "../components/speeddial/GenericSpeedDialAction";
import {getResultFromStorage} from "../../service/work/workLog";

export function useWizardComponent(
  tooltipTitle: string,
  disabled: boolean,
  icon: React.ReactNode,
  steps: GenericSpeedDialActionProps[],
): GenericSpeedDialActionProps {
  const [status, setStatus] = useState<WorkResultStatus | 'ready'>('ready');
  const [workRef, setWorkRef] = useState<number>();
  const setResult = useCallback((newWorkRef: number) => {
    setWorkRef(newWorkRef)
    if (newWorkRef === 0 || undefined) {
      setStatus("unknown")
    } else {
      getResultFromStorage(`${newWorkRef}`)
        .then((result) => setStatus(result?.status ?? "unknown"))
    }
  }, []);

  const [step, setStep] = useState<number>(0)
  const [err, setErr] = useState<string>()
  const [progressTotal, setProgressTotal] = useState<number | null>(null);
  const [progressCurrent, setProgressCurrent] = useState<number | null>(null);
  const progressReporter: ProgressReporter = useCallback((current, total) => {
    setProgressTotal(total)
    setProgressCurrent(current)
  }, []);
  const setStepProxy = useCallback((newstep: number) => {
    if (status !== "in-progress") {
      if (newstep < (steps.length)) {
        setErr(undefined)
        setProgressTotal(null)
        setProgressCurrent(null)
        setStep(newstep)
      }
    }
  }, [status, steps.length]);

  return useGenericSpeedDialActionProps(
    tooltipTitle,
    disabled,
    icon,
    <>
      {/* ERRORS */}
      <div>
        {err && <Alert color={"error"} variant={"filled"}>{err}</Alert>}
      </div>

      {/* STEPPER */}
      <div>
        <Stepper nonLinear activeStep={step}>
          {steps.map((s, i) => <Step key={i}>
            <StepButton onClick={() => setStepProxy(i)}>{s.tooltipTitle}</StepButton>
          </Step>)}
        </Stepper>
      </div>

      <hr/>

      {/* PROGRESS */}
      {progressCurrent && progressTotal && <div><Box width={"100%"}>
          <LinearProgress
              value={progressCurrent / progressTotal * 100.0}
              variant={"determinate"}
          /> {progressCurrent} / {progressTotal}
      </Box></div>}

      {workRef && status && <Alert
          variant={status === "failed" ? 'filled' : 'outlined'}
          color={status === "failed" ? 'warning' : status === "ok" ? 'success' : 'info'}
      >Result: {status === "unknown" ? 'probably ok' : status}</Alert>}

      {/* STEP CONTENT */}
      <div>
        {steps[step].description}
      </div>

      {/* BUTTONS */}

    </>,
    undefined,
    steps[step].overrideButtons ?? ((closeCallback) => <ButtonRow>
      <Button
        disabled={status === 'in-progress'}
        variant={"outlined"}
        color={"secondary"}
        onClick={closeCallback}
      >Close</Button>
      {steps[step].action && <Button
          disabled={status !== 'ready' || steps[step].disabled}
          variant={"contained"}
          color={"error"}
          onClick={() => {
            const action = steps[step].action;
            if (action) {
              setStatus("in-progress")
              action(progressReporter)
                .then((s) => setResult(s.time))
                .catch((e) => {
                  setStatus("failed")
                  setErr('Action Failed' + asString(e))
                });
            }
          }}
      >Run</Button>}
    </ButtonRow>));
}
