import React, {useContext, useEffect, useState} from "react";
import {MegaContext, SearchHostSettings} from "../../hooks/MegaContext";
import {info} from "tauri-plugin-log-api";

export const SearchPage: React.FC = () => {
  const context = useContext(MegaContext)
  const [selected, setSelected] = useState<SearchHostSettings | undefined>(undefined)
  useEffect(() => {
    setSelected(context.settings.value.searchHosts[Object.keys(context.settings.value.searchHosts)[0]])
  }, [context.settings.value])

  return <>
    <p>Search</p>
    <form onSubmit={() => info(`Submit: ${selected}`)}>
      <select onChange={(event) => {
        setSelected(context.settings.value.searchHosts[event.target.value])
        info(`onChange ${JSON.stringify(event)}`)
        info(`Selected ${JSON.stringify(selected)}`)
      }}>
        {Object.keys(context.settings.value.searchHosts).map((k) => <option value={k}>{k}</option>)}
        <option value={'asdf'}>github:_com</option>
      </select>
    </form>
  </>
}
