import {Box, SpeedDial, SpeedDialIcon} from "@mui/material";
import React from "react";
import {DataGridPro} from "@mui/x-data-grid-pro";
import EditIcon from '@mui/icons-material/Edit'
import {GitHubEditPrSpeedDial} from "./actions/GitHubEditPrSpeedDial";
import {GitHubPullRequestSearch} from "./GitHubPullRequestSearch";

export const GithubPullRequestView: React.FC = () => {
  /*
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
  */
  const dials = [GitHubEditPrSpeedDial()];
  return <>
    <GitHubPullRequestSearch/>
    {dials.map((m)=>m.modal)}
    <SpeedDial
      ariaLabel="SpeedDial openIcon example"
      sx={{position: 'absolute', bottom: 16, left: 16}}
      icon={<SpeedDialIcon icon={<EditIcon/>}/>}
    >
      {dials.map((m)=>m.dial)}
    </SpeedDial>
    <Box sx={{width: '100%'}}>
      <DataGridPro
        columns={[]}
        rows={[]}
      />
    </Box>
  </>
};
