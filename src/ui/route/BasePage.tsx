import React from "react";
import {Outlet} from "react-router-dom";
import {AppMenu} from "../menu/Menu";

export const BasePage: React.FC = () => {
  return <>
    <AppMenu/>
    <Outlet/>
  </>
}
