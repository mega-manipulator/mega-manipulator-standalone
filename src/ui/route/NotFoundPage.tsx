import React from "react";
import {Link, useLocation} from "react-router-dom";
import {Button} from "@mui/material";

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  return <>
  <h1>Not found</h1>
    <p>{location.pathname}</p>
    <p>Page was not found. Bummer.</p>
    <Link to={'/'}><Button variant={"outlined"} color={"secondary"}>Back</Button></Link>
  </>
}
