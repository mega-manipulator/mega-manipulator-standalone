import {Container, Nav, Navbar, Offcanvas} from "react-bootstrap";
import React from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {info} from 'tauri-plugin-log-api'
import {Settings} from "../settings/Settings";
import {SearchPage} from "../search/SearchPage";

export const Menu: React.FC = () => {
  return <MegaContext.Consumer>
    {context =>
      <Navbar collapseOnSelect
              expand={'xxxl'}
              className="mb-3"
              style={{
                width: '100%',
                position: 'absolute',
                top: '0px',
              }}>
        <Container fluid>
          <Navbar.Brand href="#">{context.pageHead.get}</Navbar.Brand>
          <Navbar.Toggle aria-controls={"offcanvasNavbar-expand-md"}/>
          <Navbar.Offcanvas
            id={`offcanvasNavbar-expand-md`}
            aria-labelledby={`offcanvasNavbarLabel-expand-md`}
            placement="end"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand-md`}>
                Offcanvas
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link onClick={() => {
                  info('Nav > Settings')
                  context.page.set(<Settings/>)
                  context.pageHead.set('Settings')
                }}>Settings</Nav.Link>
                <Nav.Link onClick={() => {
                  info('Nav > Search')
                  context.page.set(<SearchPage/>)
                  context.pageHead.set('Search')
                }}>Search</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    }
  </MegaContext.Consumer>;
}
