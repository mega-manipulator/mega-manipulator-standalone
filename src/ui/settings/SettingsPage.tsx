import {GitHubSearchHostSettingsPage} from "./GitHubSearchHostSettingsPage";
import {useContext, useState} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {Button, Col, Container, Form, Row, Table} from "react-bootstrap";
import {GitHubCodeHostSettingsPage} from "./GitHubCodeHostSettingsPage";
import {info} from "tauri-plugin-log-api";

export const SettingsPage = () => {
  const context = useContext(MegaContext)
  const [keepLocalRepos, setKeepLocalRepos] = useState<string | undefined>(undefined)
  return <>
    <Form>
      <Form.Group>
        <Form.Label>Keep Local Repos location</Form.Label>
        <Form.Control type={"text"}
                      placeholder="File system Location"
                      value={keepLocalRepos}
                      onChange={(event) => setKeepLocalRepos(event.target.value)}/>
      </Form.Group>
    </Form>
    <br/>
    <Button onClick={() => null}>Save settings</Button>
    <hr/>
    <Container fluid>
      <Row>
        <Col md={6}>
          <Table striped bordered hover className={'table-hover'} >
            <thead>
            <th>SearchHost</th>
            <th>Type</th>
            </thead>
            <tbody>
            {Object.keys(context.settings.value.searchHosts).map((k) => {
              const h = context.settings.value.searchHosts[k];
              return <tr onClick={() => context.navigatePage('Edit: ' + k, <GitHubSearchHostSettingsPage searchHostKey={k}/>)}>
                <td>{k} </td>
                <td>{h.type} </td>
              </tr>
            })}
            </tbody>
          </Table>
          <Button onClick={() => context.navigatePage('New search host', <GitHubSearchHostSettingsPage/>)}>Add new Search
            host</Button>
        </Col>
        <Col md={6}>
          <Table striped bordered className={'table-hover'}>
            <thead>
            <th>CodeHost</th>
            <th>Type</th>
            </thead>
            <tbody>
            {Object.keys(context.settings.value.codeHosts).map((k) => {
              const h = context.settings.value.codeHosts[k];
              return <tr onClick={() => context.navigatePage('Edit: ' + k, <GitHubCodeHostSettingsPage codeHostKey={k}/>)}>
                <td>{k} </td>
                <td>{h.type} </td>
              </tr>
            })}
            </tbody>
          </Table>
          <Button onClick={() => context.navigatePage('New code host', <GitHubCodeHostSettingsPage codeHostKey={undefined}/>)}>Add new Code
            host</Button>
        </Col>
      </Row>
    </Container>
  </>
};
