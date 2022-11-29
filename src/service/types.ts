export interface WorkProgress {
  total: number;
  done: number;
  breakdown: {
    [group: string]: number,
  };
}

export class WorkProgressTracker {
  get total(): number {
    return this._total;
  }

  get done(): number {
    return this._done;
  }

  get breakdown(): { [p: string]: number } {
    return this._breakdown;
  }

  private readonly _total: number;
  private _done: number;
  private readonly _breakdown: {
    [group: string]: number,
  };

  constructor(total: number) {
    this._total = total;
    this._done = 0;
    this._breakdown = {};
  }

  progress(group: string): WorkProgress {
    this._done += 1;
    const groupCount: number = this._breakdown[group] ?? 0
    this._breakdown[group] = groupCount + 1;
    return {
      done: this.done,
      total: this.total,
      breakdown: this.breakdown,
    }
  }
}

export type WorkResultStatus = 'ok' | 'failed' | 'in-progress'
export type WorkHistoryItem = {
  what: string,
  result: any,
  status: WorkResultStatus,
}
export type WorkMeta = {
  workLog: WorkHistoryItem[]
}

export interface WorkResultOutput<OUTPUT> {
  status: WorkResultStatus;
  meta?: OUTPUT;
}

export type WorkResultKind =
  'clone'
  | 'commit'
  | 'scriptedChange'
  | 'gitStage'
  | 'gitUnStage'
  | 'gitCommit'
  | 'gitPush'
  | 'editPr'
  | 'reviewPr'

export interface WorkResult<INPUT_ARG, INPUT, OUTPUT> {
  time: number;
  kind: WorkResultKind;
  name: string;
  status: WorkResultStatus;
  input: INPUT_ARG,
  result: {
    input: INPUT,
    output: WorkResultOutput<OUTPUT>,
  }[]
}
