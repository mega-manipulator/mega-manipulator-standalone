import {GitHubSearchHostSettingsPage} from "./GitHubSearchHostSettingsPage";
import {useContext, useState} from "react";
import {MegaContext, MegaContextType} from "../../hooks/MegaContext";
import {Button, Col, Container, Form, Row, Table} from "react-bootstrap";
import {GitHubCodeHostSettingsPage} from "./GitHubCodeHostSettingsPage";
import {error} from "tauri-plugin-log-api";
import {ResetAllSettings} from "./ResetAllSettings";
import {usePassword} from "../../hooks/usePassword";

type SearchHostRowProps = {
  searchHostKey: string,
  context: MegaContextType,
}

function rowStyle(username?: string, baseUrl?: string): React.CSSProperties | undefined {
  if (username === undefined) {
    return {background: "red"};
  }
  if (baseUrl === undefined) {
    return {background: "red"};
  }
  const [password] = usePassword(username, baseUrl)
  if (password === undefined) {
    return {background: "orange"}
  }
  return undefined
}

const SearchHostRow: React.FC<SearchHostRowProps> = ({context, searchHostKey}) => {
  const h = context.settings.value.searchHosts[searchHostKey];
  if (h.type === 'GITHUB') {
    return <tr
      style={rowStyle(h.github?.username, 'github.com')}
      onClick={() => context.navigatePage('Edit: ' + searchHostKey, <GitHubSearchHostSettingsPage
        searchHostKey={searchHostKey}/>)}>
      <td>{searchHostKey} </td>
      <td>{h.type} </td>
    </tr>
  } else {
    error(`Unable to determine class of search host ${searchHostKey} :: ${JSON.stringify(h)}`)
    return null
  }
}

type CodeHostRowProps = {
  codeHostKey: string,
  context: MegaContextType,
}

const CodeHostRow: React.FC<CodeHostRowProps> = ({context, codeHostKey}) => {
  const h = context.settings.value.codeHosts[codeHostKey];
  if (h.type === 'GITHUB') {
    return <tr
      style={rowStyle(h.github?.username, 'github.com')}
      onClick={() => context.navigatePage('Edit: ' + codeHostKey, <GitHubCodeHostSettingsPage
        codeHostKey={codeHostKey}/>)}>
      <td>{codeHostKey} </td>
      <td>{h.type} </td>
    </tr>
  } else {
    error(`Unable to determine class of code host ${codeHostKey} :: ${JSON.stringify(h)}`)
    return null
  }
}

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
          <Table striped bordered hover className={'table-hover'}>
            <thead>
            <th>SearchHost</th>
            <th>Type</th>
            </thead>
            <tbody>
            {Object.keys(context.settings.value.searchHosts)
              .map((k) => <SearchHostRow
                searchHostKey={k}
                context={context}/>)}
            </tbody>
          </Table>
          <Button onClick={() => context.navigatePage('New search host', <GitHubSearchHostSettingsPage/>)}>Add new
            Search
            host</Button>
        </Col>
        <Col md={6}>
          <Table striped bordered className={'table-hover'}>
            <thead>
            <th>CodeHost</th>
            <th>Type</th>
            </thead>
            <tbody>
            {Object.keys(context.settings.value.codeHosts)
              .map((k) => <CodeHostRow
                codeHostKey={k}
                context={context}/>)}
            </tbody>
          </Table>
          <Button onClick={() => context.navigatePage('New code host', <GitHubCodeHostSettingsPage
            codeHostKey={undefined}/>)}>Add new Code
            host</Button>
        </Col>
      </Row>
    </Container>
    <p>
      <ResetAllSettings/>
    </p>
  </>
};
