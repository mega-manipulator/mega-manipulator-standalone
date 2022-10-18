import React, {useState} from "react";
import {Box, Button, List, ListItem} from "@mui/material";
import {SearchHit} from "../../../search/types";

export type ClonePageProps = {
  searchHits: SearchHit[]
}

export const ClonePage: React.FC<ClonePageProps> = ({searchHits}) => {
  const [running, setRunning] = useState(false)
  return <Box width={"100%"}>
    <Button
      disabled={running}
      onClick={() => setRunning(true)}
    >Start clone</Button>
    <List>
      {searchHits.map((hit) => <ListItem>{hit.searchHost}/{hit.codeHost}/{hit.owner}/{hit.repo}</ListItem>)}
    </List>
  </Box>
};
