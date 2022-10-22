import React from "react";
import {createMemoryRouter} from "react-router-dom";
import {SettingsPage} from "../settings/SettingsPage";
import {SearchPage} from "../search/SearchPage";
import {GitHubSearchHostSettingsPage} from "../settings/GitHubSearchHostSettingsPage";
import {RoutingErrorBoundary} from "../error/RoutingErrorBoundary";
import {GitHubCodeHostSettingsPage} from "../settings/GitHubCodeHostSettingsPage";
import {NotFoundPage} from "./NotFoundPage";
import {locations} from "./locations";
import {BasePage} from "./BasePage";
import {ResultPage} from "../result/ResultPage";

export const megaRouter = createMemoryRouter([
  {path: '/', element: <BasePage/>, errorElement: <RoutingErrorBoundary/>, children: [
    {path: '', element: <SettingsPage/>, errorElement: <RoutingErrorBoundary/>},
    {path: locations.settings.link, element: <SettingsPage/>, errorElement: <RoutingErrorBoundary/>},
    {
      path: locations.settings.search.github.link,
      element: <GitHubSearchHostSettingsPage/>,
      errorElement: <RoutingErrorBoundary/>
    },
    {
      path: `${locations.settings.search.github.link}/:searchHostKey`,
      element: <GitHubSearchHostSettingsPage/>,
      errorElement: <RoutingErrorBoundary/>
    },
    {
      path: locations.settings.code.github.link,
      element: <GitHubCodeHostSettingsPage/>,
      errorElement: <RoutingErrorBoundary/>
    },
    {
      path: `${locations.settings.code.github.link}/:codeHostKey`,
      element: <GitHubCodeHostSettingsPage/>,
      errorElement: <RoutingErrorBoundary/>
    },

    {
      path: locations.result.link,
      element: <ResultPage/>,
      errorElement: <RoutingErrorBoundary/>,
      children: [
        {path:':ref'}
      ]
    },

    {path: locations.search.link, element: <SearchPage/>, errorElement: <RoutingErrorBoundary/>},
    {path: '*', element: <NotFoundPage/>, errorElement: <RoutingErrorBoundary/>},
    ]},
  {path: '*', element: <NotFoundPage/>, errorElement: <RoutingErrorBoundary/>}
])
