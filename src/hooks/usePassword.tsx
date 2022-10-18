import React, {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api";
import {logDebug} from "./logWrapper";

export function joinPasswordUserName(username: string, baseUrl:string):string {
  return `${username}@${baseUrl}`
}

export function usePassword(username: string, baseUrl:string): [string | undefined, (password:string) => void] {
  const username1 = joinPasswordUserName(username, baseUrl);
  const [password, setPassword] = useState<string | undefined>(undefined)
  useEffect(() => {
    invoke('get_password', {"username": username1})
      .then((pass) => {
        logDebug(`Fetched password for ${username1}`);
        setPassword(pass as string)
      })
      .catch((e) => logDebug(`Failed getting password: ${JSON.stringify(e)}`))
  }, [username1])
  const updatePassword = (newPassword:string) => {
    invoke('store_password', {
      "username": username1,
      "password": newPassword,
    }).then((e) => {
      setPassword(newPassword)
      console.log(`Password updated for ${username1}`)
    })
  }
  return [password, updatePassword];
}
