import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import {library} from '@fortawesome/fontawesome-svg-core'
import {faCheckSquare, faCoffee, fas} from '@fortawesome/free-solid-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'
import {MegaContext, MegaContextType, MegaSettingsType} from "./hooks/MegaContext";
import {Menu} from "./ui/menu/Menu";
import {Col, Container, Row} from "react-bootstrap";
import React, {useState} from "react";
import {SettingsPage} from "./ui/settings/SettingsPage";
import {trace} from "tauri-plugin-log-api";
import {useMutableState} from "./hooks/useMutableState";

function App() {
  library.add(fab, fas, faCheckSquare, faCoffee)
  const [settings, updateSettings] = useMutableState<MegaSettingsType>({
    version: '1',
    theme: 'dark',
    searchHosts: {
      "github.com": {
        type: "GITHUB",
        github: {
        }
      }
    },
    codeHosts: {
      "github.com": {
        type: 'GITHUB',
        github: {}
      }
    },
  })
  const [pageHead, setPageHead] = useState('Settings')
  const [page, setPage] = useState(<SettingsPage/>)

  const defaultValue: MegaContextType = {
    settings: {value: settings, update: updateSettings},
    pageHead: pageHead,
    page: page,
    navigatePage: (pageHead: string, page: JSX.Element) => {
      trace(`Going to ${pageHead}`)
      setPageHead(pageHead);
      setPage(page);
    },
  }

  return <MegaContext.Provider value={defaultValue}>
    <div className={``} style={{width:"100%"}}>
      <Menu/>
      <hr/>
      <Container style={{
        width:"100%",
        margin: "1px"
      }}>
        <Row>
          <Col md={12}>
            {page}
          </Col>
        </Row>
      </Container>
    </div>
  </MegaContext.Provider>
}

export default App
