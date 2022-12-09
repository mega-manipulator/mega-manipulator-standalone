import React, {useEffect, useState} from "react";
import {Alert, Box, Button, ListItemButton, ListItemButtonProps, Modal, Typography} from "@mui/material";
import {RepoBadStatesReport} from "../../service/file/cloneDir";
import {modalStyle} from "../modal/megaModal";
import {fs, path} from "@tauri-apps/api";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {MegaSettingsType} from "../../hooks/settings";
import {ButtonRow} from "../components/ButtonRow";

export type DeleteMenuItemProps = {
  settings: MegaSettingsType,
  repos: RepoBadStatesReport[],
  reloadCallback: () => void,
  listItemButtonProps: ListItemButtonProps,
}

export const DeleteMenuItem: React.FC<DeleteMenuItemProps> = (
  {
    settings,
    repos,
    reloadCallback,
    listItemButtonProps
  }) => {
  const [showModal, setShowModal] = useState(false)
  const [used, setUsed] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  useEffect(() => {
    setUsed(false)
    setErrors([])
    setShowModal(false)
  }, [settings, repos])

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
        <Typography variant={'h6'}>Delete {repos.length} repos from workdir?</Typography>
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
                for (const repo of repos) {
                  const repoPath = await path.join(basePath, repo.repoPathShort)
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
