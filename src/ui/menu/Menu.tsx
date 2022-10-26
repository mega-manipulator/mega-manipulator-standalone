import React from "react";
import {IconButton, MenuItem} from "@mui/material";
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";
import {info} from "tauri-plugin-log-api";

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
        position: "fixed",
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
        info('Nav > SettingsPage')
        navigate(locations.settings.link)
      }}>Settings</MenuItem>

      <MenuItem onClick={() => {
        info('Nav > Search')
        navigate(locations.search.link)
      }}>Search</MenuItem>
      <MenuItem onClick={() => {
        info('Nav > Clones')
        navigate(locations.clones.link)
      }}>Clones</MenuItem>
      <MenuItem onClick={() => {
        info('Nav > Result')
        navigate(locations.result.link)
      }}>Results</MenuItem>
      <MenuItem onClick={() => {
        info('Nav > Logs')
        navigate(locations.logs.link)
      }}>Logs</MenuItem>
    </Menu>
  </div>;
}
