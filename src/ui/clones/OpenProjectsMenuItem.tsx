import React, {useContext} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {openDirs} from "../../service/file/scriptFile";
import {os} from "@tauri-apps/api";
import {GenericMultiProjectMenuItem} from "./GenericMultiProjectMenuItem";

export const OpenProjectsMenuItem: React.FC = () => {
  const {clones: {selected}, settings} = useContext(MegaContext);
  return <GenericMultiProjectMenuItem
    openButtonText={'Open with EditorApplication'}
    confirm={`Really open ${selected.length} instances of with ${settings.editorApplication}?`}
    action={() => openDirs(settings, selected)}
    isAvailable={() => os.type().then((type) => type === "Darwin")} // TODO: Do something for windows and Linux
  />
}
export const OpenWorkdirMenuItem: React.FC = () => {
  const {clones: {paths}, settings} = useContext(MegaContext);
  return <GenericMultiProjectMenuItem
    openButtonText={'Open entire workdir with EditorApplication'}
    confirm={`Really open entire workdir, with ${paths.length} projects, at once in ${settings.editorApplication}?`}
    action={() => openDirs(settings, [settings.clonePath])}
    isAvailable={() => os.type().then((type) => type === "Darwin")} // TODO: Do something for windows and Linux
  />
}
