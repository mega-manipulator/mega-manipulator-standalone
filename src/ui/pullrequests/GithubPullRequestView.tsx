import {Box, SpeedDial, SpeedDialIcon} from "@mui/material";
import React from "react";
import {DataGridPro} from "@mui/x-data-grid-pro";
import EditIcon from '@mui/icons-material/Edit'
import {GitHubEditPrSpeedDial} from "./actions/GitHubEditPrSpeedDial";

const menuItems = []
function useMenuItems(){}

export const GithubPullRequestView: React.FC = () => {
    {/*
    <Select>
      <MenuItem>Decline PR</MenuItem>
      <MenuItem>Reword PR</MenuItem>
      <MenuItem>Clone PR</MenuItem>
      <MenuItem>Open in Browser</MenuItem>
      <MenuItem>Add comment</MenuItem>
      <MenuItem>Mark Approved</MenuItem>
      <MenuItem>Mark Needs Work</MenuItem>
      <MenuItem>Merge</MenuItem>
    </Select>
    */}
  return <>

    <SpeedDial
      ariaLabel="SpeedDial openIcon example"
      sx={{ position: 'absolute', bottom: 16, left: 16 }}
      icon={<SpeedDialIcon openIcon={<EditIcon />} />}
    >
      <GitHubEditPrSpeedDial/>
    </SpeedDial>
    <Box sx={{width: '100%'}}>
      <DataGridPro
        columns={[]}
        rows={[]}
      />
    </Box>
  </>
};
