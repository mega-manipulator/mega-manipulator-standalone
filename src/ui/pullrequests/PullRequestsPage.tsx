import React, {useContext, useEffect, useState} from "react";
import {Alert, FormControlLabel, MenuItem, Select, Typography} from "@mui/material";
import {MegaContext} from "../../hooks/MegaContext";
import {CodeHostType} from "../../hooks/settings";
import {GithubPullRequestView} from "./GithubPullRequestView";

const DynamicPullRequestView:React.FC<{codeHostType:CodeHostType | undefined}> = ({codeHostType}) => {
  switch (codeHostType) {
    case "GITHUB":
      return <GithubPullRequestView/>
    case undefined:
      return <Alert variant={"filled"} color={"error"}>Not able to determine code host type, your settings might be borked?</Alert>
  }
}

export const PullRequestsPage: React.FC = () => {
  const {settings} = useContext(MegaContext);
  const [codeHostKey, setCodeHostKey] = useState<string>('github.com');

  const [codeHostType, setCodeHostType] = useState<CodeHostType | undefined>('GITHUB');
  useEffect(() => {
    if (codeHostKey && settings && settings.codeHosts && settings.codeHosts[codeHostKey]){
      setCodeHostType(settings.codeHosts[codeHostKey].type)
    }else{
      setCodeHostType(undefined)
    }
  }, [codeHostKey, settings, settings.codeHosts]);
  
  
  return <>
    <Typography variant={'h4'}>Pull Requests</Typography>
    <FormControlLabel control={<Select value={codeHostKey}>
      {Object.keys(settings.codeHosts).map((key, index) => <MenuItem
          key={index}
          value={key}
          onSelect={() => setCodeHostKey(key)}
        >{key}</MenuItem>)}
    </Select>} label={'Code host'}/>
    {!codeHostType }

    <DynamicPullRequestView codeHostType={codeHostType}/>
  </>
};
