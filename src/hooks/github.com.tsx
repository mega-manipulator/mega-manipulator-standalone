import {Octokit} from "octokit";
import {retry} from "@octokit/plugin-retry";
import {throttling} from "@octokit/plugin-throttling";
import {error, info, warn} from "tauri-plugin-log-api";
import {useContext} from "react";
import {MegaContext} from "./MegaContext";
import {usePassword} from "./usePassword";

export function useOctokit(): Octokit | undefined {
  info('myOctokit 1') // TODO: DELETE_ME
  const context = useContext(MegaContext);
  info('myOctokit 2') // TODO: DELETE_ME
  info('myOctokit 3') // TODO: DELETE_ME
  const username: string | undefined = context.settings.value.searchHosts['github.com']?.github?.username;
  info('myOctokit 4') // TODO: DELETE_ME
  if (username === undefined) {
    warn('No username set')
    return undefined
  }
  info('Getting password')
  const [password, setPassword]: [(string | undefined), ((password: string) => void)] = usePassword(username, 'github.com')
  if (password === undefined) {
    warn('Password not set')
    return undefined
  } else {
    info('Password is set, setting up an octokit for you.')
  }
  const PluggedOctokit = Octokit.plugin(throttling, retry);
  const octokit: Octokit = new PluggedOctokit({
    auth: password,
    throttle: {

      onRateLimit: (retryAfter: number, options: any) => {
        warn(`Request quota exhausted for request ${options.method} ${options.url}`);

        if (options.request.retryCount === 0) {
          // only retries once
          info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onAbuseLimit: (retryAfter: number, options: any) => {
        // does not retry, only logs a warning
        warn(`Abuse detected for request ${options.method} ${options.url}`);
      },
    },
    log: {
      debug: (e) => {
      },
      info: (e) => info(e),
      warn: (e) => warn(e),
      error: (e) => error(e),
    },
    retry: {
      doNotRetry: ["404", "403", "429"],
    },
  })
  return octokit
}
