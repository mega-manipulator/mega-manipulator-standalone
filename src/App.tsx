import {useEffect} from "react";
import ErrorBoundary from "./ui/error/ErrorBoundry";
import {RouterProvider} from "react-router-dom";
import {megaRouter} from "./ui/route/megaRouter";
import {attachConsole} from "tauri-plugin-log-api";
import {MegaContext, newMegaContext} from "./hooks/MegaContext";

function App() {
  useEffect(() => {
    (async () => {
      await attachConsole()
    })()
  }, []);
  const ctx = newMegaContext()
  return <ErrorBoundary>
    <MegaContext.Provider value={ctx}>
      <RouterProvider router={megaRouter}/>
    </MegaContext.Provider>
  </ErrorBoundary>
}

export default App
