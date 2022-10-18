import React from "react";
import {info} from 'tauri-plugin-log-api'
import {IconButton, MenuItem} from "@mui/material";
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";

export const AppMenu: React.FC = () => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return <div>
    <IconButton
      color={"secondary"}
      id="basic-button"
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000,
      }}
      aria-controls={open ? 'basic-menu' : undefined}
      aria-haspopup="true"
      aria-expanded={open ? 'true' : undefined}
      onClick={handleClick}
    ><MenuIcon/></IconButton>
    <Menu id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
    >
      <MenuItem onClick={() => {
        info('Nav > SettingsPage').then(_ => navigate(locations.settings.link))
        //handleClose()
      }}>Settings</MenuItem>

      <MenuItem onClick={() => {
        info('Nav > Search').then(_ => navigate(locations.search.link))
      }}>Search</MenuItem>
    </Menu>
  </div>;
}
