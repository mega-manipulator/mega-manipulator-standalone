import {Container, Nav, Navbar, Offcanvas} from "react-bootstrap";
import React from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {info} from 'tauri-plugin-log-api'
import {SettingsPage} from "../settings/SettingsPage";
import {SearchPage} from "../search/SearchPage";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export const Menu: React.FC = () => {
  return <MegaContext.Consumer>
    {context =>
      <Navbar collapseOnSelect
              expand={'xxxl'}
              className="mb-3"
              style={{
                width: '100%',
                top: '0px',
              }}>
        <Container fluid>
          <Navbar.Brand href="#">{context.pageHead}</Navbar.Brand>
          <Navbar.Toggle aria-controls={"offcanvasNavbar-expand-md"}/>
          <Navbar.Offcanvas
            id={`offcanvasNavbar-expand-md`}
            aria-labelledby={`offcanvasNavbarLabel-expand-md`}
            placement="end"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand-md`}>
                Menu
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link onClick={() => {
                  info('Toggle > darkMode')
                  context.settings.update({
                    ...context.settings.value,
                    theme: `${context.settings.value.theme === 'dark' ? 'light' : 'dark'}`
                  })
                }}>Toggle theme ({context.settings.value.theme}) <FontAwesomeIcon
                  icon={['fas', `${context.settings.value.theme === 'dark' ? 'planet-moon' : 'sunrise'}`]}/>
                </Nav.Link>
                <Nav.Link onClick={() => {
                  info('Nav > SettingsPage')
                  context.navigatePage('Settings', <SettingsPage/>)
                }}>Settings</Nav.Link>
                <Nav.Link onClick={() => {
                  info('Nav > Search')
                  context.navigatePage('Search', <SearchPage/>)
                }}>Search</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    }
  </MegaContext.Consumer>;
}
