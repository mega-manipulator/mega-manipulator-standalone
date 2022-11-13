import React, {useEffect, useState} from "react";
import {Alert, Box, Button, ListItemButton, Modal} from "@mui/material";
import {RepoBadStatesReport} from "../../service/file/cloneDir";
import {modalStyle} from "../modal/megaModal";
import {useNavigate} from "react-router-dom";
import {fs, path} from "@tauri-apps/api";
import {error} from "tauri-plugin-log-api";
import {asString} from "../../hooks/logWrapper";
import {MegaSettingsType} from "../../hooks/MegaContext";

export type DeleteMenuItemProps = {
  settings: MegaSettingsType | null,
  repos: RepoBadStatesReport[],
  reloadCallback: ()=>void,
}

export const DeleteMenuItem: React.FC<DeleteMenuItemProps> = ({settings, repos, reloadCallback}) => {
  const nav = useNavigate()
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
      onClick={() => {
        setErrors([])
        setShowModal(true)
      }}
    >Delete</ListItemButton>
    <Modal open={showModal} onClose={() => {
      setShowModal(false)
      reloadCallback()
    }}>
      <Box sx={modalStyle}>
        {errors.map((e) =>
          <Alert variant={"filled"} color={"error"}>{e}</Alert>
        )}
        <Button
          disabled={used}
          variant={"contained"}
          color={"error"}
          onClick={() => {
            (async () => {
              setUsed(true)
              let errAggregate: string[] = []
              if (!settings) return
              const basePath = settings.clonePath
              if (!basePath) return
              for (const repo of repos) {
                const repoPath = await path.join(basePath, repo.repoPath)
                try {
                  await fs.removeDir(repoPath, {recursive: true});
                } catch (e) {
                  let message = `Failed removing '${repoPath}' due to '${asString(e)}'`;
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
        <Button
          variant={"outlined"}
          color={"secondary"}
          onClick={() => {
            setShowModal(false)
          }}
        >Close</Button>
      </Box>
    </Modal>
  </>
}