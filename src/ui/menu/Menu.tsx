import React, {useContext} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {info} from 'tauri-plugin-log-api'
import {SettingsPage} from "../settings/SettingsPage";
import {SearchPage} from "../search/SearchPage";
import {Button, Grid, IconButton, MenuItem, Typography} from "@mui/material";
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';

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
    <Grid container padding={1} width={"100%"}>
      <Grid item alignContent={"end"} alignSelf={"end"} alignItems={"end"}>
        <IconButton
          color={"secondary"}
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        ><MenuIcon/></IconButton>
      </Grid>
      <Grid item>
        <Typography variant={'h4'}>{context.pageHead}</Typography>
      </Grid>
    </Grid>
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
