import React from "react";

export type MegaTheme = 'dark' | 'light'

export type MegaSettingsType = {
  theme: MegaTheme,
}

export type MegaContextType = {
  settings: { get: MegaSettingsType, set: (settings: MegaSettingsType) => void },
  pageHead: { get: string, set: (theme: string) => void },
  page: { get: JSX.Element, set: (theme: JSX.Element) => void },
}

export const MegaContext = React.createContext<MegaContextType>({
  page: {
    get: <></>,
    set: (page: JSX.Element) => {
    },
  },
  pageHead: {
    get: '',
    set: (pageHead: string) => {
    },
  },
  settings: {
    get: {theme: 'dark'},
    set: (theme: MegaSettingsType) => {
    },
  }
})
