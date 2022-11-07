import {MegaSettingsType} from "../hooks/MegaContext";

export interface CodeHostClient {
  codeHostKey:string;
  createPullRequest(owner:string, repo:string, title:string, description:string | null, head:string, base:string):void;
}

export type CodeHostClientsMap = { [clientKey: string]:CodeHostClient };

/**
 * TODO: IMPLEMENT!!!
 */
function getAllCodeHostClients(settings:MegaSettingsType):CodeHostClientsMap{
  const keys = settings.codeHosts

  throw new Error('Not yet implemented!!!')
}
