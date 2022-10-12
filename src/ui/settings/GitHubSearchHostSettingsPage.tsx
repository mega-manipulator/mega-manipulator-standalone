import {Button, Col, Container, Form, Row} from "react-bootstrap";
import {invoke} from "@tauri-apps/api";
import {ReactElement, useContext, useEffect, useMemo, useState} from "react";
import {GitHubSearchHostSettings, MegaContext} from "../../hooks/MegaContext";
import {SettingsPage} from "./SettingsPage";
import {debug, info, warn} from "tauri-plugin-log-api";

export type SearchHostSettingsProps = {
  searchHostKey?: string,
}

export const GitHubSearchHostSettingsPage: (props: SearchHostSettingsProps) => ReactElement = ({searchHostKey}) => {
  const context = useContext(MegaContext)
  const settings = useMemo(() => searchHostKey ? context.settings.value.searchHosts[searchHostKey]?.github : undefined, [])
  const [searchHostKeyVal, setSearchHostKeyVal] = useState<string | undefined>(searchHostKey)
  const [searchHost, setSearchHost] = useState<GitHubSearchHostSettings>(settings ?? {username: ''})
  const [password, setPassword] = useState('')
  useEffect(() => {
    invoke('get_password', {"username": searchHost.username})
      .then((e) => info(`Fetched password for username ${searchHost.username}`))
      .catch((e) => debug(`Failed getting password: ${JSON.stringify(e)}`))
  }, [searchHost.username])
  const [hidePassword, setHidePassword] = useState(true)

  return <>
    <Container>
      <Row>
        <Col md={12} lg={6}>
          <Form>
            <Form.Group>
              {searchHostKey === undefined ? <></> : <></>}
              <Form.Label>Username</Form.Label>
              <Form.Control type={"text"}
                            placeholder="Username"
                            value={searchHost.username}
                            onChange={(event) => setSearchHost({
                              ...searchHost,
                              username: event.target.value,
                            })}/>
            </Form.Group>

            {
              // TODO: Add better validation!!!
              // Now it's possible to overwrite existing nodes
            }
            <Button disabled={
              searchHostKey === undefined
              && searchHostKeyVal !== undefined
              && searchHostKeyVal.length > 0
              && searchHost?.username !== undefined
              && searchHost?.username.length > 0
            } onClick={() => {
              if (searchHostKey === undefined) {
                throw 'Not implemented correctly!!' // TODO

                info('Creating new Search host config node')
                const ref = context.settings.value
                ref.searchHosts[searchHostKeyVal as string] = {
                  type: 'GITHUB', github: {
                    username: searchHost.username,
                  }
                }
                context.settings.update(ref)
              } else if (context.settings) {
                info('Updating old Search host config node')
                warn('Not implemented')
              }
            }}>
              {searchHostKeyVal ? 'Update' : 'Create'}
            </Button>
          </Form>
        </Col>
        <Col md={12} lg={6}>
          <Form>
            <Form.Group>
              <Form.Label>Password</Form.Label>
              <Form.Control type={hidePassword ? "password" : "text"}
                            placeholder="Password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}/>
              <Form.Label>Hide Password</Form.Label>
              <Form.Check type="switch" checked={hidePassword} onClick={() => setHidePassword(!hidePassword)}/>
            </Form.Group>
            <Button variant="primary" onClick={() =>
              invoke('store_password', {
                "username": searchHost.username,
                "password": password,
              }).then((e) => console.log('Done'))
            }>
              Update password
            </Button>

          </Form>
        </Col>
      </Row>
    </Container>
    <hr/>
    <div>
      <Button onClick={() => context.navigatePage('Settings', <SettingsPage/>)}>Back</Button>
    </div>
  </>
};
