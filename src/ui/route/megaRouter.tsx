import React from "react";
import {createMemoryRouter} from "react-router-dom";
import {SettingsPage} from "../settings/SettingsPage";
import {SearchPage} from "../search/SearchPage";
import {GitHubSearchHostSettingsPage} from "../settings/GitHubSearchHostSettingsPage";
import ErrorBoundary from "../ErrorBoundry";
import {GitHubCodeHostSettingsPage} from "../settings/GitHubCodeHostSettingsPage";
import {NotFoundPage} from "./NotFoundPage";
import {locations} from "./locations";

export const megaRouter = createMemoryRouter([
  {path: '/', element: <SettingsPage/>, errorElement: <ErrorBoundary/>},
  {
    path: locations.settings.link, element: <SettingsPage/>, errorElement: <ErrorBoundary/>, children: [
      {path: 'search/github', element: <GitHubSearchHostSettingsPage/>, errorElement: <ErrorBoundary/>},
      {path: 'search/github/:searchHostKey', element: <GitHubSearchHostSettingsPage/>, errorElement: <ErrorBoundary/>},
      {path: 'code/github', element: <GitHubCodeHostSettingsPage/>, errorElement: <ErrorBoundary/>},
      {path: 'code/github/:codeHostKey', element: <GitHubCodeHostSettingsPage/>, errorElement: <ErrorBoundary/>},
    ]
  },
  {path: locations.search.link, element: <SearchPage/>, errorElement: <ErrorBoundary/>},
  {path: '*', element: <NotFoundPage/>, errorElement: <ErrorBoundary/>}
])
