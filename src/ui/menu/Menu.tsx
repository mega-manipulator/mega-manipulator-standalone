import React, {useState} from "react";
import {Avatar, Drawer, List, ListItem} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";
import {info} from "tauri-plugin-log-api";

export const AppMenu: React.FC = () => {
  const navigate = useNavigate()
  const [isOpen, setOpen] = useState(false)
  return <div>
    <Avatar
      style={{position:"fixed", top: 10, right:10}}
      onClick={() => setOpen(!isOpen)}
    ><MenuIcon/></Avatar>
    <Drawer open={isOpen} onClose={() => setOpen(false)} anchor={"right"}>
      <List>
        <ListItem onClick={() => {
          info('Nav > SettingsPage')
          setOpen(false)
          navigate(locations.settings.link)
        }}>Settings</ListItem>

        <ListItem onClick={() => {
          info('Nav > Search')
          setOpen(false)
          navigate(locations.search.link)
        }}>Search</ListItem>
        <ListItem onClick={() => {
          info('Nav > Clones')
          setOpen(false)
          navigate(locations.clones.link)
        }}>Clones</ListItem>
        <ListItem onClick={() => {
          info('Nav > Result')
          setOpen(false)
          navigate(locations.result.link)
        }}>Results</ListItem>
        <ListItem onClick={() => {
          info('Nav > Logs')
          setOpen(false)
          navigate(locations.logs.link)
        }}>Logs</ListItem>
      </List>
    </Drawer>
  </div>;
}
