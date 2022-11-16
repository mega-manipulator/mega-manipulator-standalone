import React, {useContext} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {openDirs} from "../../service/file/scriptFile";
import {os} from "@tauri-apps/api";
import {GenericMultiProjectMenuItem} from "./GenericMultiProjectMenuItem";

export const OpenProjectsMenuItem: React.FC = () => {
  const {clones: {selected}, settings} = useContext(MegaContext);
  return <GenericMultiProjectMenuItem
    openButtonText={'Open with EditorApplication'}
    confirmText={`Really Run open ${selected.length} with ${settings.editorApplication}?`}
    action={() => openDirs(settings, selected)}
    isAvailable={() => os.type().then((type) => type === "Darwin")} // TODO: Do something for windows and Linux
  />
}
