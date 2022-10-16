import React, {useContext} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {info} from 'tauri-plugin-log-api'
import {SettingsPage} from "../settings/SettingsPage";
import {SearchPage} from "../search/SearchPage";
import {Button, MenuItem} from "@mui/material";
import Menu from '@mui/material/Menu';

export const AppMenu: React.FC = () => {
  const context = useContext(MegaContext)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return <div>
    <Button
      variant={"contained"}
      color={"secondary"}
      id="basic-button"
      aria-controls={open ? 'basic-menu' : undefined}
      aria-haspopup="true"
      aria-expanded={open ? 'true' : undefined}
      onClick={handleClick}
    >Menu</Button>
    <Menu id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
    >
      <MenuItem onClick={async () => {
        context.navigatePage('Settings', <SettingsPage/>)
        await info('Nav > SettingsPage')
        handleClose()
      }}>Settings</MenuItem>

      <MenuItem onClick={async () => {
        context.navigatePage('Search', <SearchPage/>)
        await info('Nav > Search')
        handleClose()
      }}>Search</MenuItem>
    </Menu>
  </div>;
}
