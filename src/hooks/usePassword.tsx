import React, {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api";
import {asString} from "./logWrapper";
import {debug, info, trace} from "tauri-plugin-log-api";

/**
 * Used for creating a single identifier for storing and retrieving credentials from the OS store
 */
export function joinServiceUserName(username: string, baseUrl: string): string {
  return `${username}@${baseUrl}`
}

export async function getPassword(username?: string, baseUrl?: string): Promise<(string | null)> {
  if (username && baseUrl) {
    const joinedUsername = joinServiceUserName(username, baseUrl)
    let password: string | null = null;
    try {
      trace(`Fetched password for ${joinedUsername}`);
      password = await invoke('get_password', {"username": joinedUsername})
    } catch (e) {
      debug(`Failed getting password: ${asString(e)}`)
    }
    return password
  } else {
    return null
  }
}

export function usePassword(username?: string, baseUrl?: string): [string | null, (password: string) => Promise<void>] {
  const [password, setPassword] = useState<string | null>(null)
  useEffect(() => {
    (async () => {
      let osPass = await getPassword(username, baseUrl);
      trace('found password ' + osPass) // TODO: DELETE?
      setPassword(osPass)
    })()
  }, [username, baseUrl])
  const updatePassword = async (newPassword: string) => {
    if (username && baseUrl && newPassword) {
      const joinedUsername = joinServiceUserName(username, baseUrl)
      await invoke('store_password', {
        "username": joinedUsername,
        "password": newPassword,
      })
      setPassword(newPassword)
      info(`Password updated for ${joinedUsername}`)
    } else {
      throw new Error('Updated password without username and baseUrl')
    }
  }
  return [password, updatePassword];
}
