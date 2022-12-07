import {Component, ErrorInfo, ReactNode} from "react";
import {Button, Typography} from "@mui/material";
import {createDefault} from "../../hooks/settings";
import {error, info} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {process} from "@tauri-apps/api";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

function wipe() {
  createDefault().then(() => info('Settings wiped')).then(() => process.relaunch())
}

class ErrorBoundary extends Component<Props, State> {
  private error?: Error;
  private errorInfo?: ErrorInfo;
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    // Update state so the next render will show the fallback UI.
    return {hasError: true};
  }

  public componentDidCatch(error2: Error, errorInfo: ErrorInfo) {
    this.error = error2;
    this.errorInfo = errorInfo;
    error(`Uncaught error: ${asString(error2)} :: ErrorInfo: ${errorInfo?.componentStack?.replaceAll('\n', ' > ')}`);
  }

  public render() {
    if (this.state.hasError) {
      return <>
        <h1>Sorry.. there was an error</h1>
        {this.error && <Typography>Error: {this.error.toString()}</Typography>}
        <br/>
        {this.errorInfo && <Typography>ErrorInfo: {JSON.stringify(this.errorInfo)}</Typography>}
        <Button color={"error"} variant={"outlined"} onClick={wipe}>Wipe settings</Button>
      </>;
    } else {
      return this.props.children;
    }
  }
}

export default ErrorBoundary;
