import {Badge, Button, Form} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {joinPasswordUserName, usePassword} from "../../hooks/usePassword";

export type PasswordFormProps = {
  username?: string,
  hostname?: string,
}

export const PasswordForm: React.FC<PasswordFormProps> = ({username, hostname}) => {
    if (username === undefined) {
      return <Badge bg={"warning"} text={"dark"}>Username not set, but is needed in order to save a password/token for
        this host.</Badge>
    } else if (hostname === undefined) {
      return <Badge bg={"warning"} text={"dark"}>Hostname not set, but is needed in order to save a password/token for
        this host.</Badge>
    }
    const [password, updatePassword] = usePassword(username, hostname)
    const [formPassword, setFormPassword] = useState(password ?? '')
    useEffect(() => {
      setFormPassword(password ?? '')
    }, [password])
    const username1 = joinPasswordUserName(username, hostname);
    const [hidePassword, setHidePassword] = useState(true)
    return <Form>
      <Form.Group>
        <Form.Label>Password/Token for {username1}</Form.Label>
        <Form.Control type={hidePassword ? "password" : "text"}
                      placeholder="Password"
                      value={formPassword}
                      onChange={(event) => setFormPassword(event.target.value)}/>
        <Form.Label>Hide Password</Form.Label>
        <Form.Check type="switch" checked={hidePassword} onClick={() => setHidePassword(!hidePassword)}/>
      </Form.Group>
      <span>
        <Button variant="primary" onClick={() => updatePassword(formPassword)}>
          Update password
        </Button>&nbsp;
        <Button variant={'danger'} disabled={true}>Remove password</Button>
      </span>
    </Form>

  }
;
