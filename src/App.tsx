import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import {Ui} from "./ui/Ui";
import {library} from '@fortawesome/fontawesome-svg-core'
import {faCheckSquare, faCoffee, fas} from '@fortawesome/free-solid-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'
import {AppProps, Page} from "./ui/types";
import {useState} from "react";

function App() {
  library.add(fab, fas, faCheckSquare, faCoffee)

  const [page, setPage] = useState(Page.SETTINGS)
  const appProps: AppProps = {
    page: {
      get: () => page,
      set: (page: Page) => setPage(page)
    },
  }

  return <div className="dark bg-dark text-dark navbar-dark">
    <Ui appProps={appProps}/>
  </div>
}

export default App
