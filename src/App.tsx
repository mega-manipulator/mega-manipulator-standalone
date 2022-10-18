import React from "react";
import ErrorBoundary from "./ui/ErrorBoundry";
import {RouterProvider} from "react-router-dom";
import {megaRouter} from "./ui/route/megaRouter";

function App() {
  return <ErrorBoundary>
    <RouterProvider router={megaRouter}/>
  </ErrorBoundary>
}

export default App
