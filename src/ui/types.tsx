
export type AppProps = {
  page: {
    get: () => Page,
    set: (page: Page) => void,
  },
}

export enum Page {
  SETTINGS = 'Settings',
}
