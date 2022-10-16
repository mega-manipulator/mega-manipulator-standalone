import {MegaContext, MegaContextType} from "./hooks/MegaContext";
import {AppMenu} from "./ui/menu/Menu";
import React from "react";
import {useMegaContext} from "./hooks/useMegaContext";

function App() {
  const megaContext: MegaContextType = useMegaContext()

  return <MegaContext.Provider value={megaContext}>
    <AppMenu/>
    <hr/>
    {megaContext.page}
  </MegaContext.Provider>
}

export default App
