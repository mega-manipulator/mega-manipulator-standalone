import {useEffect} from "react";
import ErrorBoundary from "./ui/error/ErrorBoundry";
import {RouterProvider} from "react-router-dom";
import {megaRouter} from "./ui/route/megaRouter";
import {attachConsole} from "tauri-plugin-log-api";
import {MegaContext, useMegaContext} from "./hooks/MegaContext";
import {EnvValidationWarning} from "./ui/settings/EnvValidationWarning";

function App() {
  useEffect(() => {
    (async () => {
      await attachConsole()
    })()
  }, []);
  const ctx = useMegaContext()
  return <ErrorBoundary>
    <MegaContext.Provider value={ctx}>
      <EnvValidationWarning/>
      <RouterProvider router={megaRouter}/>
    </MegaContext.Provider>
  </ErrorBoundary>
}

export default App
