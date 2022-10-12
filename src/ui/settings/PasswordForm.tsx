import {Badge, Button, Form} from "react-bootstrap";
import {invoke} from "@tauri-apps/api";
import {useEffect, useState} from "react";
import {debug, info} from "tauri-plugin-log-api";

export type PasswordFormProps = {
  username?: string,
  hostname?: string,
}

export const PasswordForm: React.FC<PasswordFormProps> = ({username, hostname}) => {
    const username1 = `${username}@${hostname}`;
    const [password, setPassword] = useState('')
    useEffect(() => {
      invoke('get_password', {"username": username1})
        .then((pass) => {
          debug(`Fetched password for ${username1}`);
          setPassword(pass as string)
        })
        .catch((e) => debug(`Failed getting password: ${JSON.stringify(e)}`))
    }, [username1])
    const [hidePassword, setHidePassword] = useState(true)
    if (username === undefined) {
      return <Badge bg={"warning"} text={"dark"}>Username not set, but is needed in order to save a password/token for this host.</Badge>
    } else if (hostname === undefined) {
      return <Badge bg={"warning"} text={"dark"}>Hostname not set, but is needed in order to save a password/token for this host.</Badge>
    } else {
      return <Form>
        <Form.Group>
          <Form.Label>Password/Token for {username1}</Form.Label>
          <Form.Control type={hidePassword ? "password" : "text"}
                        placeholder="Password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}/>
          <Form.Label>Hide Password</Form.Label>
          <Form.Check type="switch" checked={hidePassword} onClick={() => setHidePassword(!hidePassword)}/>
        </Form.Group>
        <Button variant="primary" onClick={() =>
          invoke('store_password', {
            "username": username1,
            "password": password,
          }).then((e) => console.log('Done'))
        }>
          Update password
        </Button>

      </Form>
    }
  }
;
