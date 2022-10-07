import {Container, Nav, Navbar, Offcanvas} from "react-bootstrap";
import React, {ReactElement} from "react";
import {AppProps} from "../types";

export type MenuProps = {
  appProps: AppProps,
}

export const Menu: (menuProps: MenuProps) => ReactElement = ({appProps}) => {
  return <>
    <Navbar collapseOnSelect
            expand={'xxxl'}
            className="mb-3"
            style={{
              width: '100%',
              position: 'absolute',
              top: '0px',
            }}>
      <Container fluid>
        <Navbar.Brand href="#">{appProps.page.get()}</Navbar.Brand>
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
              <Nav.Link onClick={() => console.log('Home')}>Home</Nav.Link>
              <Nav.Link onClick={() => console.log('Link')}>Link</Nav.Link>
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  </>;
}
