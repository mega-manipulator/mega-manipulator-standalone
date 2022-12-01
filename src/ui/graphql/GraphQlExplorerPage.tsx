import React from "react";
import {Box, Typography} from "@mui/material";
import {ApolloExplorer} from '@apollo/explorer/react';
import {EmbeddableExplorerOptions} from "@apollo/explorer/src/react/ApolloExplorer";
import {debug} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";

const iniSate:EmbeddableExplorerOptions = {
  initialState : {
    document: `query Example {
me {
  id
}
}`,
    variables: {
      test: 'abcxyz',
    },
    displayOptions: {
      showHeadersAndEnvVars: true,
    },
  },
  schema:'https://docs.github.com/public/schema.docs.graphql',
  endpointUrl:'https://api.github.com/graphql',
  handleRequest: async (endpointUrl, options) => {
    const response = await window.fetch(endpointUrl, options)
    debug('Got response: ' + asString(response))
    return response;
  }
}
export const GraphQlExplorerPage: React.FC = () => {
  return <Box sx={{height:"100%"}}>
    <Typography>GraphQL Explorer</Typography>
    <Box style={{height: "100vh", width:"100%"}}>
      <ApolloExplorer {...iniSate}/>
    </Box>
  </Box>
}
