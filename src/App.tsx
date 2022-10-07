import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import {library} from '@fortawesome/fontawesome-svg-core'
import {faCheckSquare, faCoffee, fas} from '@fortawesome/free-solid-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'
import {MegaContext, MegaContextType, MegaSettingsType} from "./hooks/MegaContext";
import {Menu} from "./ui/menu/Menu";
import {Col, Container, Row} from "react-bootstrap";
import React, {useState} from "react";
import {Settings} from "./ui/settings/Settings";

function App() {
  library.add(fab, fas, faCheckSquare, faCoffee)
  const [settings, setSettings] = useState<MegaSettingsType>({theme: 'dark'})
  const [pageHead, setPageHead] = useState('Settings')
  const [page, setPage] = useState(<Settings/>)

  const defaultValue: MegaContextType = {
    settings: {get: settings, set: setSettings},
    pageHead: {get: pageHead, set: setPageHead},
    page: {get: page, set: setPage},
  }

  return <MegaContext.Provider value={defaultValue}>
    <div className="dark bg-dark text-dark navbar-dark">
      <Menu/>
      <Container
        fluid={false}
        style={{
          position: "absolute",
          top: "70px",
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
