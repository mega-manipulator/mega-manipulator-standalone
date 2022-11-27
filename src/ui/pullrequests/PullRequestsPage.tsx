import React, {useContext, useEffect, useState} from "react";
import {Alert, MenuItem, Select, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {CodeHostType} from "../../hooks/settings";
import {GithubPullRequestView} from "./GithubPullRequestView";
import {PullRequestsTable} from "./PullRequestsTable";

const DynamicPullRequestView: React.FC<{ codeHostType: CodeHostType | undefined }> = ({codeHostType}) => {
  switch (codeHostType) {
    case "GITHUB":
      return <GithubPullRequestView/>
    case undefined:
      return <Alert variant={"filled"} color={"error"}>Not able to determine code host type, your settings might be
        borked?</Alert>
  }
}

export const PullRequestsPage: React.FC = () => {
  const {settings} = useContext(MegaContext);
  const [codeHostKey, setCodeHostKey] = useState<string>('github.com');

  const [codeHostType, setCodeHostType] = useState<CodeHostType | undefined>('GITHUB');
  useEffect(() => {
    if (codeHostKey && settings && settings.codeHosts && settings.codeHosts[codeHostKey]) {
      setCodeHostType(settings.codeHosts[codeHostKey].type)
    } else {
      setCodeHostType(undefined)
    }
  }, [codeHostKey, settings, settings.codeHosts]);

  return <>
    <Typography variant={'h4'}>Pull Requests</Typography>
    <Select label={'Code host'} value={codeHostKey}>
        {Object.keys(settings.codeHosts).map((key, index) => <MenuItem
          key={index}
          value={key}
          onSelect={() => setCodeHostKey(key)}
        >{key}</MenuItem>)}
      </Select>

    <DynamicPullRequestView codeHostType={codeHostType}/>
    <PullRequestsTable/>
  </>
};
