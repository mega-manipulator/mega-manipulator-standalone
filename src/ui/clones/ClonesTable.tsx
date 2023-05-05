import { DataGridPro, GridColDef, GridRenderCellParams, GridRowId } from '@mui/x-data-grid-pro';
import { Alert, Box, CircularProgress, Tooltip } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { MegaContext } from '../../hooks/MegaContext';
import { analyzeRepoForBadStates, listRepos, RepoBadStatesReport, Report } from '../../service/file/cloneDir';
import { simpleAction } from '../../service/file/simpleActionWithResult';
import { asString } from '../../hooks/logWrapper';
import { path } from '@tauri-apps/api';

type ClonesTableProps = {
  repoStates: RepoBadStatesReport[];
  setRepoStates: (repoStates: RepoBadStatesReport[]) => void;
  reload: () => void;
};

export function useClonesTableProps(): ClonesTableProps {
  const {
    settings,
    clones: { setPaths, setSelected },
  } = useContext(MegaContext);

  const [repoStates, setRepoStates] = useState<RepoBadStatesReport[]>([]);
  const reload = useCallback(() => {
    if (settings !== null) {
      setSelected([]);
      (async () => {
        const paths = await listRepos(settings.clonePath);
        setPaths(paths);
        setRepoStates(
          paths.map((path) => {
            const trimmedRepoPath = path.substring((settings.clonePath?.length ?? -1) + 1);
            return new RepoBadStatesReport(path, trimmedRepoPath);
          })
        );
        const analysis: RepoBadStatesReport[] = await simpleAction(
          { settings, hits: paths },
          async (_index, _hit, path) => analyzeRepoForBadStates(settings, path),
          async (hit, err) => {
            const r: Report = {
              state: 'failed to execute',
              error: asString(err),
            };
            const repoPathLong: string = await path.join(settings.clonePath, hit.codeHost, hit.owner, hit.repo);
            const report: RepoBadStatesReport = {
              repoPathShort: `${hit.codeHost}/${hit.owner}/${hit.repo}`,
              repoPathLong,
              uncommittedChanges: r,
              onDefaultBranch: r,
              noDiffWithOriginHead: r,
              noCodeHostConfig: r,
              hasPullRequest: r,
            };
            return report;
          }
        );
        setRepoStates(analysis);
      })();
    }
  }, [setPaths, setSelected, settings]);
  useEffect(() => {
    reload();
  }, [settings]);

  return {
    repoStates,
    setRepoStates,
    reload,
  };
}

export const ClonesTable: React.FC<ClonesTableProps> = ({ repoStates }) => {
  const {
    clones: { setSelected, selectedModel },
  } = useContext(MegaContext);
  return (
    <Box sx={{ width: '100%' }}>
      <DataGridPro
        autoHeight
        rows={repoStates.map((d, i) => {
          return {
            id: i,
            ...d,
          };
        })}
        selectionModel={selectedModel}
        onSelectionModelChange={(model: GridRowId[]) => {
          setSelected(model.map((r) => +r));
        }}
        columns={columns}
        pagination
        checkboxSelection
      />
    </Box>
  );
};

const renderBoolCell = (params: GridRenderCellParams) => {
  const report = params.value as Report;
  switch (report.state) {
    case 'loading':
      return <CircularProgress />;
    case 'good': {
      const inner = (
        <Alert variant={'outlined'} severity={'success'} icon={<span>👍</span>}>
          Good
        </Alert>
      );
      if (report.error !== null && report.error !== undefined) {
        return <Tooltip title={report.error}>{inner}</Tooltip>;
      } else {
        return inner;
      }
    }
    case 'bad':
      return (
        <Tooltip title={report.error}>
          <Alert variant={'outlined'} severity={'warning'} icon={<span>💩</span>}>
            Bad
          </Alert>
        </Tooltip>
      );
    case 'failed to execute':
      return (
        <Tooltip title={report.error}>
          <Alert variant={'outlined'} severity={'error'} icon={<span>🧨</span>}>
            Failed to execute
          </Alert>
        </Tooltip>
      );
  }
};
const boolCellProps: Partial<GridColDef<any, RepoBadStatesReport, boolean>> = {
  width: 175,
  minWidth: 50,
  maxWidth: 500,
  editable: false,
  resizable: true,
  type: 'object',
  renderCell: renderBoolCell,
};

const columns: GridColDef[] = [
  { field: 'id', hideable: true, minWidth: 25, maxWidth: 100, hide: true },
  {
    field: 'repoPathShort',
    headerName: 'Repo Path',
    width: 400,
    maxWidth: 800,
    editable: false,
    resizable: true,
  },
  {
    field: 'repoPathLong',
    headerName: 'Repo Path (Long)',
    width: 800,
    maxWidth: 800,
    editable: false,
    resizable: true,
    hideable: true,
    hide: true,
  },
  {
    field: 'noCodeHostConfig',
    headerName: 'Has Code Host Config',
    ...boolCellProps,
  },
  {
    field: 'uncommittedChanges',
    headerName: 'No uncommitted Changes',
    ...boolCellProps,
  },
  {
    field: 'onDefaultBranch',
    headerName: 'Not On Default Branch',
    ...boolCellProps,
  },
  {
    field: 'hasPullRequest',
    headerName: 'Has open PR',
    ...boolCellProps,
  },
  {
    field: 'noDiffWithOriginHead',
    headerName: 'Has Diff With Origin Head',
    ...boolCellProps,
    hideable: true,
    hide: true,
  },
];
