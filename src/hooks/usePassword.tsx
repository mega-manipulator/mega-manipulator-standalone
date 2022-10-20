import React, {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api";
import {asString, logDebug, logError, logInfo} from "./logWrapper";

/**
 * Used for creating a single idientifier for storing and retrieving credentials from the OS store
 */
export function joinServiceUserName(username: string, baseUrl: string): string {
  return `${username}@${baseUrl}`
}

export async function getPassword(username?: string, baseUrl?: string): Promise<(string | null)> {
  if (username && baseUrl) {
    const joinedUsername = joinServiceUserName(username, baseUrl)
    let password: string | null = null;
    try {
      logDebug(`Fetched password for ${joinedUsername}`);
      password = await invoke('get_password', {"username": joinedUsername})
    } catch (e) {
      logDebug(`Failed getting password: ${asString(e)}`)
    }
    return password
  } else {
    return null
  }
}

export function usePassword(username?: string, baseUrl?: string): [string | null, (password: string) => void] {
  const [password, setPassword] = useState<string | null>(null)
  useEffect(() => {
    (async ()=>{
    let osPass = await getPassword(username, baseUrl);
    logDebug('found password '+osPass) // TODO: DELETE
    setPassword(osPass)
    })()
  }, [username, baseUrl])
  const updatePassword = (newPassword: string) => {
    if(username && baseUrl && newPassword){
      const joinedUsername = joinServiceUserName(username, baseUrl)
      invoke('store_password', {
        "username": joinedUsername,
        "password": newPassword,
      }).then(_ => {
        setPassword(newPassword)
        logInfo(`Password updated for ${joinedUsername}`)
      })
    } else {
      logError('Updated password without username and baseUrl')
    }
  }
  return [password, updatePassword];
}
