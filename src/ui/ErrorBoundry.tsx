import React, {Component, ErrorInfo, ReactNode} from "react";
import {Button, Typography} from "@mui/material";
import {createDefault} from "../hooks/settings";
import {logError} from "../hooks/logWrapper";

interface Props {
  nav?: () => void;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

function wipe() {
  createDefault()
}

class ErrorBoundary extends Component<Props, State> {
  private error?: Error;
  private errorInfo?: ErrorInfo;
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return {hasError: true};
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.error = error;
    this.errorInfo = errorInfo;
    logError("Uncaught error: " + error.toString() + ' :: ErrorInfo: ' + errorInfo?.componentStack?.replaceAll('\n', ' > '));
  }

  public render() {
    if (this.state.hasError) {
      return <>
        <h1>Sorry.. there was an error</h1>
        {this.error && <Typography>Error: {this.error.toString()}</Typography>}
        <br/>
        {this.errorInfo && <Typography>ErrorInfo: {JSON.stringify(this.errorInfo)}</Typography>}
        <Button color={"error"} variant={"outlined"} onClick={wipe}>Wipe settings</Button>
        {this.props.nav !== undefined ?
          <Button color={"primary"} variant={"contained"}
                  onClick={() => this.props.nav !== undefined ? this.props.nav() : window.alert('Not implemented')}>Back
            to settings page</Button>
          : null}
      </>;
    } else {
      return this.props.children;
    }
  }
}

export default ErrorBoundary;
