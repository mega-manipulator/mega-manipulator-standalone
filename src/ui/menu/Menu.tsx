import React, {useState} from "react";
import {Avatar, Drawer, List, ListItemButton, SxProps, Theme} from "@mui/material";
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
  /*{nav: locations.graphql.link, title: 'GraphQL Explorer'},*/

  {nav: locations.thanks.link, title: 'Thanks'},
]

export const AppMenu: React.FC = () => {
  const navigate = useNavigate()
  const {pathname} = useLocation();
  const [isOpen, setOpen] = useState(false)
  const [isHover, setIsHover] = useState(false);
  const avatarStyle: React.CSSProperties = {
    zIndex: 999,
    position: "fixed",
    top: 10,
    right: 10,
    color: '#000',
  }
  const avatarSx: SxProps<Theme> = {
    bgcolor: isHover ? '#fff' : '#aaa',
    borderColor: '#fff',
    borderWidth: 2,
    borderStyle: "solid",
    width: 56,
    height: 56,
  }
  return <div>
    <Avatar
      sx={avatarSx}
      style={avatarStyle}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={() => setOpen(!isOpen)}
    ><MenuIcon/></Avatar>
    <Drawer open={isOpen} onClose={() => setOpen(false)} anchor={"right"}>
      <List>
        {items.map((item, index) => <ListItemButton
          key={index}
          selected={pathname === item.nav}
          onClick={() => {
            info('Nav > ' + item.title)
            setOpen(false)
            navigate(item.nav)
          }}>{item.title}</ListItemButton>)}
      </List>
    </Drawer>
  </div>;
}
