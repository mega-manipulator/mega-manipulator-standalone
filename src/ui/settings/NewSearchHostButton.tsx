import React, {useState} from "react";
import {Box, Button, FormControl, MenuItem, Modal, Select} from "@mui/material";
import {modalStyle} from "../modal/megaModal";
import {SearchHostType} from "../../hooks/settings";
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";

export const NewSearchHostButton: React.FC = () => {
  const nav = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<SearchHostType>('SOURCEGRAPH')
  return <>
    <Button
      variant={"contained"}
      disabled={modalOpen}
      onClick={() => setModalOpen(true)}
    >New Search Host</Button>
    <Modal open={modalOpen}>
      <Box sx={modalStyle}>
        <FormControl>
          <Select
            value={selectedType}
          >
            {(['SOURCEGRAPH', 'GITHUB'] as SearchHostType[])
              .map((type, index) => <MenuItem
                key={index}
                value={type}
                onSelect={() => setSelectedType(type)}
              >{type}</MenuItem>)}
          </Select>

        </FormControl>
        <Button
          onClick={() => {
            switch (selectedType) {
              case "SOURCEGRAPH":
                nav(locations.settings.search.sourcegraph.link)
                break
              case "GITHUB":
                nav(locations.settings.search.github.link)
                break
            }
          }}
        >Add new Search Host</Button>
      </Box>
    </Modal>
  </>
};
