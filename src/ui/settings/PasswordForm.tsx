import React, {useEffect, useState} from "react";
import {joinServiceUserName, usePassword} from "../../hooks/usePassword";
import {Alert, Badge, Button, FormControl, FormGroup, FormLabel, Input, Switch} from "@mui/material";

export type PasswordFormProps = {
  passwordPhrase: string,
  username?: string,
  hostname?: string,
}

export const PasswordForm: React.FC<PasswordFormProps> = ({username, hostname, passwordPhrase}) => {
    if (username === undefined) {
      return <Alert severity={"warning"}>{'Username not set, but is needed in order to save a '+passwordPhrase+' for this host.'}</Alert>
    } else if (hostname === undefined) {
      return <Alert severity={"warning"}>{'Hostname not set, but is needed in order to save a '+passwordPhrase+' for this host.'}</Alert>
    }
    const [password, updatePassword] = usePassword(username, hostname)
    const [formPassword, setFormPassword] = useState(password ?? '')
    useEffect(() => {
      setFormPassword(password ?? '')
    }, [password])
    const username1 = joinServiceUserName(username, hostname);
    const [hidePassword, setHidePassword] = useState(true)
    return <FormControl>
      <FormGroup>
        <FormLabel>{passwordPhrase} for {username1}</FormLabel>
        <Input type={hidePassword ? "password" : "text"}
               placeholder={passwordPhrase}
               value={formPassword}
               onChange={(event) => setFormPassword(event.target.value)}/>
        <FormLabel>Hide Password</FormLabel>
        <Switch checked={hidePassword} onClick={() => setHidePassword(!hidePassword)}/>
      </FormGroup>
      <span>
        <Button color="primary" onClick={() => updatePassword(formPassword)}>
          Update password
        </Button>&nbsp;
        <Button color={"error"} disabled={true}>Remove password</Button>
      </span>
    </FormControl>

  }
;
