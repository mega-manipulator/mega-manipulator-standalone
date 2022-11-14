import React from "react";
import {MenuItem, Select, Typography} from "@mui/material";

export const PullRequestSearchPage: React.FC = ()=>{
  return <>
    <Typography variant={'h4'}>Pull Request Search</Typography>
    <Select>
      <MenuItem>Decline PR</MenuItem>
      <MenuItem>Reword PR</MenuItem>
      <MenuItem>Clone PR</MenuItem>
      <MenuItem>Open in Browser</MenuItem>
      <MenuItem>Set Assignees</MenuItem>
      <MenuItem>Add comment</MenuItem>
      <MenuItem>Mark Approved</MenuItem>
      <MenuItem>Mark Needs Work</MenuItem>
      <MenuItem>Merge</MenuItem>
    </Select>
  </>
};
