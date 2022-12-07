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
import {ClonesPage} from "../clones/ClonesPage";
import {LogsPage} from "../LogsPage";
import {SourceGraphSearchHostSettingsPage} from "../settings/SourceGraphSearchHostSettingsPage";
import {PullRequestsPage} from "../pullrequests/PullRequestsPage";
import {ThanksPage} from "../ThanksPage";

export const megaRouter = createMemoryRouter([
  {
    path: '/', element: <BasePage/>, errorElement: <RoutingErrorBoundary/>, children: [
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
        path: locations.settings.search.sourcegraph.link,
        element: <SourceGraphSearchHostSettingsPage/>,
        errorElement: <RoutingErrorBoundary/>
      },
      {
        path: `${locations.settings.search.sourcegraph.link}/:searchHostKey`,
        element: <SourceGraphSearchHostSettingsPage/>,
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
          {path: ':ref'}
        ]
      },
      {
        path: locations.clones.link,
        element: <ClonesPage/>,
        errorElement: <RoutingErrorBoundary/>,
      },
      {
        path: locations.logs.link,
        element: <LogsPage/>,
        errorElement: <RoutingErrorBoundary/>,
      },

      {
        path: locations.pullRequests.link,
        element: <PullRequestsPage/>,
        errorElement: <RoutingErrorBoundary/>,
      },

      {
        path: locations.thanks.link,
        element: <ThanksPage/>,
        errorElement: <RoutingErrorBoundary/>,
      },

      {path: locations.search.link, element: <SearchPage/>, errorElement: <RoutingErrorBoundary/>},
      {path: '*', element: <NotFoundPage/>, errorElement: <RoutingErrorBoundary/>},
    ]
  },
  {path: '*', element: <NotFoundPage/>, errorElement: <RoutingErrorBoundary/>}
])
