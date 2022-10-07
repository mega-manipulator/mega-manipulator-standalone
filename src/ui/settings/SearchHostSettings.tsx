import {Button, Form} from "react-bootstrap";
import {invoke} from "@tauri-apps/api";
import {ReactElement, useState} from "react";

export type SearchHostSettingsProps = {}

export const SearchHostSettings: (props: SearchHostSettingsProps) => ReactElement = ({}) => {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)

  return <Form>
    <Form.Group>
      <Form.Label>Username</Form.Label>
      <Form.Control type={"text"}
                    placeholder="Username"
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}/>
    </Form.Group>
    <Form.Group>
      <Form.Label>Password</Form.Label>
      <Form.Control type={hidePassword ? "password" : "text"}
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}/>
    </Form.Group>
    <Form.Group>
      <Form.Label>Hide Password</Form.Label>
      <Form.Check type="switch" checked={hidePassword} onClick={() => setHidePassword(!hidePassword)}/>
    </Form.Group>
    <Button variant="primary" onClick={() =>
      invoke('store_password', {
        "username": userName,
        "password": password,
      }).then((e) => console.log('Done'))
    }>
      Save
    </Button>
  </Form>
};
