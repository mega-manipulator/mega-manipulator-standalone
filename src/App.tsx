import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import {MegaContext, MegaContextType} from "./hooks/MegaContext";
import {Menu} from "./ui/menu/Menu";
import {Col, Container, Row} from "react-bootstrap";
import React from "react";
import {useMegaContext} from "./hooks/useMegaContext";

function App() {
  const megaContext: MegaContextType = useMegaContext()

  return <MegaContext.Provider value={megaContext}>
    <div className={``} style={{width: "100%"}}>
      <Menu/>
      <hr/>
      <Container style={{
        width: "100%",
        margin: "1px"
      }}>
        <Row>
          <Col md={12}>
            {megaContext.page}
          </Col>
        </Row>
      </Container>
    </div>
  </MegaContext.Provider>
}

export default App
