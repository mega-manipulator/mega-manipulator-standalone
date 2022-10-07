import {Col, Container, Row} from "react-bootstrap";
import {Menu} from "./menu/Menu";
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
  appProps: AppProps,
}

export const Ui: (uiProps: UiProps) => ReactElement = ({appProps}) => {
  return <>
    <Menu appProps={appProps}/>
    <Container
      fluid={false}
      style={{
        position: "absolute",
        top: "70px",
      }}>
      <Row>
        <Col md={12}>
          {renderPage(appProps.page.get())}
        </Col>
      </Row>
    </Container>
  </>
}
