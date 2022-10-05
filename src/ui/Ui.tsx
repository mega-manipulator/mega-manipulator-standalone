import {Button, Col, Container, Row} from "react-bootstrap";
import {Menu} from "./menu/Menu";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {AppProps, Page} from "./types";
import {Settings} from "./settings/Settings";
import {ReactElement} from "react";

function renderPage(page: Page): ReactElement {
  switch (page) {
    case Page.SETTINGS:
      return <Settings/>
  }
}

export type UiProps = {
  appProps:AppProps,
}

export const Ui: (uiProps:UiProps) => ReactElement = ({appProps}) => {
  return <Container fluid={"md"}>
    <Row>
      <Col md={1}>
        <Button onClick={() => appProps.menu.show.set(!appProps.menu.show.get())}>
          <FontAwesomeIcon icon="comment-arrow-up"/>
        </Button>
      </Col>
      <Col md={11}>{appProps.page.get()}</Col>
    </Row>
    <Row>
      {appProps.menu.show.get() ?
        <Col md={4}>
          <Menu/>
        </Col>
        : null}
      <Col md={appProps.menu.show.get() ? 8 : 12}>
        {renderPage(appProps.page.get())}
      </Col>
    </Row>
  </Container>
}
