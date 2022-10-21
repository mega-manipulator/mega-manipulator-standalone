import {SearchHit} from "../../ui/search/types";
import {WorkProgress, WorkProgressTracker} from "../types";
import {sleep} from "../delay";
import {logInfo} from "../../hooks/logWrapper";

export type CloneState = 'cloned from remote' | 'cloned from local' | 'failed'
export type CloneType = 'SSH' | 'HTTPS'

export async function clone(hits: SearchHit[], cloneType: CloneType, cancelled:boolean, listener: (progress: WorkProgress) => void) {
  let progressTracker = new WorkProgressTracker(hits.length)
  for (const hit of hits) {
    if (cancelled) break
    await sleep(1000)
    if (cancelled) break
    //TODO clone shit
    const url = cloneType === 'SSH' ? hit.sshClone : hit.httpsClone;
    logInfo(`Clone ${url} cancelled:${cancelled}`)

    const progress = progressTracker.progress('failed')
    listener(progress)
  }
}
