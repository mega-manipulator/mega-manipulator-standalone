import {Badge, Button, Col, Container, Form, Row} from "react-bootstrap";
import {ReactElement, useContext, useEffect, useMemo, useState} from "react";
import {GitHubSearchHostSettings, MegaContext} from "../../hooks/MegaContext";
import {SettingsPage} from "./SettingsPage";
import {info, warn} from "tauri-plugin-log-api";
import {PasswordForm} from "./PasswordForm";
import {useMutableState} from "../../hooks/useMutableState";
import {confirm} from "@tauri-apps/api/dialog";

export type SearchHostSettingsProps = {
  searchHostKey?: string,
}

export const GitHubSearchHostSettingsPage: (props: SearchHostSettingsProps) => ReactElement = ({searchHostKey}) => {
  const context = useContext(MegaContext)
  const [forceReload, setForceReload] = useState(0)
  const settings = useMemo(() => searchHostKey ? context.settings.value.searchHosts[searchHostKey]?.github : undefined, [context.settings, forceReload])
  const [searchHostKeyVal, setSearchHostKeyVal] = useState<string>(searchHostKey ?? '')
  const [searchHostKeySame, setSearchHostKeySame] = useState(0)
  useEffect(() => {
    setSearchHostKeySame(Object.keys(context.settings.value.searchHosts).filter((it) => it === searchHostKeyVal).length)
  }, [searchHostKeyVal])
  const [searchHost, setSearchHost] = useMutableState<GitHubSearchHostSettings>(settings ?? {
    username: '',
    codeHostKey: 'github.com',
    baseUrl: 'https://api.github.com'
  })
  const [validationError, setValidationError] = useState<string | undefined>(undefined)
  useEffect(() => {
    let errors: string[] = [];
    if (searchHostKeyVal.length === 0) errors.push('Search host key cannot be empty')
    if (searchHostKey === undefined && searchHostKeySame > 0) errors.push('Search host key already defined')
    if (searchHostKey !== undefined && searchHostKeySame > 1) errors.push('Search host key already defined')
    if (searchHostKey !== undefined && searchHostKey !== searchHostKeyVal) errors.push('Search host key cannot be changed')
    if (searchHost.username === undefined || searchHost.username.length < 1) errors.push('Username is undefined')
    if (errors.length === 0) setValidationError(undefined); else setValidationError(errors.join(', '));
  }, [searchHost, searchHostKeyVal])

  return <>
    <Container>
      <Row>
        <Col md={12} lg={6}>
          <Form>
            <Form.Group>
              <Form.Label>Search Host Key</Form.Label>
              <Form.Control type={"text"}
                            disabled={searchHostKey !== undefined}
                            placeholder="Search Host Key"
                            value={searchHostKeyVal}
                            onChange={(event) => setSearchHostKeyVal(event.target.value)}
                            isValid={(searchHostKey !== undefined && searchHostKeySame > 1) || (searchHostKey === undefined && searchHostKeySame > 0)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Username</Form.Label>
              <Form.Control type={"text"}
                            placeholder="Username"
                            value={searchHost.username}
                            onChange={(event) => setSearchHost((draft) => {
                              draft.username = event.target.value
                            })}/>
            </Form.Group>

            <Button
              disabled={validationError !== undefined}
              onClick={() => {
                if (searchHostKey === undefined) {
                  if (searchHostKeyVal.length > 0 && searchHostKeySame === 0) {
                    info('Creating new Search host config node')
                    context.settings.update((settingsDraft) => {
                      settingsDraft.searchHosts[searchHostKeyVal] = {
                        type: 'GITHUB',
                        github: searchHost,
                      }
                    })
                    context.navigatePage('Settings', <SettingsPage/>)
                  } else {
                    warn('Failed validation')
                  }
                } else if (searchHostKeyVal.length > 0 && searchHostKeySame === 1) {
                  info('Updating old Search host config node')
                  context.settings.update((settingsDraft) => {
                    settingsDraft.searchHosts[searchHostKeyVal] = {
                      type: 'GITHUB',
                      github: searchHost,
                    }
                  })
                  setForceReload(forceReload + 1)
                }
              }}>
              {searchHostKeyVal ? 'Update' : 'Create'}
            </Button>
            {validationError ? <Badge bg={"danger"}>{validationError}</Badge> : null}
            <Button
              variant={"danger"}
              disabled={searchHostKey === undefined || searchHostKey === 'github.com'}
              onClick={() => {
                if (searchHostKey !== undefined) {
                  confirm(`Delete ${searchHostKey}?`).then((ans) => {
                    if (ans) {
                      context.settings.update(settingsDraft => {
                        delete settingsDraft.searchHosts[searchHostKey]
                      })
                      context.navigatePage('Settings', <SettingsPage/>)
                    }
                  })
                }
              }}
            >Delete search host</Button>
          </Form>
        </Col>
        <br/>
        <hr/>
        <Col md={12} lg={6}>
          {searchHostKey !== undefined && settings !== undefined ?
            <PasswordForm username={settings.username} hostname={settings.baseUrl}/> : <></>}
        </Col>
      </Row>
    </Container>
    <hr/>
    <div>
      <Button onClick={() => context.navigatePage('Settings', <SettingsPage/>)}>Back</Button>
    </div>
  </>;
};
