import {useNavigate, useRouteError} from "react-router-dom";
import {Button} from "@mui/material";
import {locations} from "../route/locations";
import React from "react";

export const RoutingErrorBoundary: React.FC = () => {
  const err = useRouteError()
  const nav = useNavigate()
  return <>
  <h1>Sheit 💩🚽🧻</h1>
    <p>Something went really bad.</p>
    <p>{(err as any)?.toString()}</p>
    <Button onClick={() => nav(locations.settings.link)}>Back to settings</Button>
  </>
}
