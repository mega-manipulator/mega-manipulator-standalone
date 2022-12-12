import React, {useContext, useEffect, useState} from "react";
import {Alert, Box, Button, ListItemButton, ListItemButtonProps, Modal, Typography} from "@mui/material";
import {modalStyle} from "../modal/megaModal";
import {fs, path} from "@tauri-apps/api";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {ButtonRow} from "../components/ButtonRow";
import {MegaContext} from "../../hooks/MegaContext";

export type DeleteMenuItemProps = {
  reloadCallback: () => void,
  listItemButtonProps: ListItemButtonProps,
}

export const DeleteMenuItem: React.FC<DeleteMenuItemProps> = (
  {
    reloadCallback,
    listItemButtonProps
  }) => {
  const {settings, clones: {selected}} = useContext(MegaContext)
  const [showModal, setShowModal] = useState(false)
  const [used, setUsed] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  useEffect(() => {
    setUsed(false)
    setErrors([])
    setShowModal(false)
  }, [settings, selected])

  return <>
    <ListItemButton
      {...listItemButtonProps}
      onClick={() => {
        setErrors([])
        setShowModal(true)
      }}
    >Delete Clones</ListItemButton>
    <Modal open={showModal} onClose={() => {
      setShowModal(false)
      reloadCallback()
    }}>
      <Box sx={modalStyle}>
        {errors.map((e, i) =>
          <Alert key={i} variant={"filled"} color={"error"}>{e}</Alert>
        )}
        <Typography variant={'h6'}>Delete {selected.length} repos from workdir?</Typography>
        <Typography>They will still be available in the keep dir to clone/copy again ⚡️</Typography>
        <ButtonRow>

          <Button
            variant={"outlined"}
            color={"secondary"}
            onClick={() => {
              setShowModal(false)
            }}
          >Close</Button>
          <Button
            disabled={used}
            variant={"contained"}
            color={"error"}
            onClick={() => {
              (async () => {
                setUsed(true)
                const errAggregate: string[] = []
                if (!settings) return
                const basePath = settings.clonePath
                if (!basePath) return
                for (const repo of selected) {
                  const repoPath = await path.join(basePath, repo)
                  try {
                    await fs.removeDir(repoPath, {recursive: true});
                  } catch (e) {
                    const message = `Failed removing '${repoPath}' due to '${asString(e)}'`;
                    error(message)
                    errAggregate.push(message)
                  }
                }
                setErrors(errAggregate)
                if (errAggregate.length === 0) {
                  setShowModal(false)
                  reloadCallback()
                }
              })()
            }}
          >Delete</Button>
        </ButtonRow>
      </Box>
    </Modal>
  </>
}
