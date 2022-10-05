
export type AppProps = {
  page: {
    get: () => Page,
    set: (page: Page) => void,
  },
  menu: {
    show: {
      get: () => boolean,
      set: (show: boolean) => void,
    }
  }
}

export enum Page {
  SETTINGS = 'Settings',
}
