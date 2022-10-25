import React, {useEffect} from "react";
import ErrorBoundary from "./ui/error/ErrorBoundry";
import {RouterProvider} from "react-router-dom";
import {megaRouter} from "./ui/route/megaRouter";
import {attachConsole} from "tauri-plugin-log-api";

function App() {
  useEffect(() => {
    (async () => {
      await attachConsole()
    })()
  }, []);
  return <ErrorBoundary>
    <RouterProvider router={megaRouter}/>
  </ErrorBoundary>
}

export default App
