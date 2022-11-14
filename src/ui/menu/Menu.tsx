import React, {useState} from "react";
import {Avatar, Drawer, List, ListItem} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import {useLocation, useNavigate} from "react-router-dom";
import {locations} from "../route/locations";
import {info} from "tauri-plugin-log-api";

const items: {
  nav: string;
  title: string;
}[] = [
  {nav: locations.settings.link, title: 'Settings'},
  {nav: locations.search.link, title: 'Search Code'},
  {nav: locations.clones.link, title: 'Clones'},
  {nav: locations.result.link, title: 'Result'},
  {nav: locations.logs.link, title: 'Logs'},
  {nav: locations.pullRequests.link, title: 'Search Pull Requests'},
]

export const AppMenu: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation();
  const [isOpen, setOpen] = useState(false)
  return <div>
    <Avatar
      style={{position: "fixed", top: 10, right: 10}}
      onClick={() => setOpen(!isOpen)}
    ><MenuIcon/></Avatar>
    <Drawer open={isOpen} onClose={() => setOpen(false)} anchor={"right"}>
      <List>
        {items.map((item, index) => <ListItem key={index} selected={pathname === item.nav} onClick={() => {
          info('Nav > ' + item.title)
          setOpen(false)
          navigate(item.nav)
        }}>{item.title}</ListItem>)}
      </List>
    </Drawer>
  </div>;
}
