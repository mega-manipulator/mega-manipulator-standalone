import React from "react";
import {Box, Typography} from "@mui/material";
import {ApolloExplorer} from '@apollo/explorer/react';
import {EmbeddableExplorerOptions} from "@apollo/explorer/src/react/ApolloExplorer";

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
  handleRequest: (endpointUrl, options)=> {
    return window.fetch(endpointUrl, options)
  }
}
export const GraphQlExplorerPage: React.FC = () => {
  return <>
    <Typography>GraphQL Explorer</Typography>
    <Box style={{height: "100vh", width:"100%"}}>
      <ApolloExplorer {...iniSate}/>
    </Box>
  </>
}
