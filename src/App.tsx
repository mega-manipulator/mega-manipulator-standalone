import './App.css'
import {ThemeProvider} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Ui} from "./ui/Ui";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faCheckSquare, faCoffee } from '@fortawesome/free-solid-svg-icons'
import {AppProps, Page} from "./ui/types";
import {useState} from "react";


function App() {
  library.add(fab, fas, faCheckSquare, faCoffee)

  const [page,setPage] = useState(Page.SETTINGS)
  const [menuShow,setMenuShow] = useState(false)
  const appProps: AppProps = {
    page: {
      get: () => page,
      set: (page: Page) => setPage(page)
    },
    menu: {
      show: {
        get: () => menuShow,
        set: (show: boolean) => setMenuShow(show)
      }
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <ThemeProvider
          breakpoints={['xxxl', 'xxl', 'xl', 'lg', 'md', 'sm', 'xs', 'xxs']}
          minBreakpoint="xxs"
        >
          <Ui appProps={appProps}/>
        </ThemeProvider>
      </header>
    </div>
  )
}

export default App
