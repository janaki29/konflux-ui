import * as React from 'react';
import { difference, merge, uniq } from 'lodash-es';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { useNamespace } from '../shared/providers/Namespace';
import { TektonResourceLabel, TaskRunKind, TektonResultsRun, PipelineRunKind } from '../types';
import { isTaskV1Beta1 } from '../utils/pipeline-utils';
import { OR } from '../utils/tekton-results';
import { useTRTaskRuns } from './useTektonResults';

export const SCAN_RESULT = 'CLAIR_SCAN_RESULT';
export const SCAN_RESULTS = 'CLAIR_SCAN_RESULTS';
export const CVE_SCAN_RESULT = 'CVE_SCAN_RESULT';
export const TEKTON_SCAN_RESULTS = 'TEKTON_SCAN_RESULTS';
export const SCAN_OUTPUT = 'SCAN_OUTPUT';

export const CVE_SCAN_RESULT_FIELDS = [
  SCAN_RESULT,
  SCAN_RESULTS,
  CVE_SCAN_RESULT,
  TEKTON_SCAN_RESULTS,
  SCAN_OUTPUT,
];

export const isCVEScanResult = (taskRunResults: TektonResultsRun) =>
  CVE_SCAN_RESULT_FIELDS.includes(taskRunResults?.name);

export type ScanResults = {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
};

export const getScanResults = (taskRuns: TaskRunKind[]): [ScanResults, TaskRunKind[]] => {
  const scanResults = taskRuns.reduce(
    (acc, scanTaskRun) => {
      const results = isTaskV1Beta1(scanTaskRun)
        ? scanTaskRun?.status?.taskResults
        : scanTaskRun?.status?.results;
      const taskScanResult = results?.find((result) => isCVEScanResult(result));
      if (taskScanResult) {
        acc[1].push(scanTaskRun);
        try {
          const resultObj: ScanResults = JSON.parse(taskScanResult.value);
          acc[0].vulnerabilities.critical += resultObj.vulnerabilities?.critical ?? 0;
          acc[0].vulnerabilities.high += resultObj.vulnerabilities?.high ?? 0;
          acc[0].vulnerabilities.medium += resultObj.vulnerabilities?.medium ?? 0;
          acc[0].vulnerabilities.low += resultObj.vulnerabilities?.low ?? 0;
          acc[0].vulnerabilities.unknown += resultObj.vulnerabilities?.unknown ?? 0;
        } catch (e) {
          // ignore
        }
      }
      return acc;
    },
    [
      {
        vulnerabilities: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          unknown: 0,
        },
      },
      [],
    ] as [ScanResults, TaskRunKind[]],
  );

  if (scanResults[1].length) {
    return scanResults;
  }
  return [null, []];
};

export const useScanResults = (pipelineRunName: string): [ScanResults, boolean] => {
  const namespace = useNamespace();
  // Fetch directly from tekton-results because a task result is only present on completed tasks runs.
  const [taskRuns, loaded] = useTRTaskRuns(
    pipelineRunName ? namespace : null,
    React.useMemo(
      () => ({
        filter: OR(
          ...CVE_SCAN_RESULT_FIELDS.map((field) => `data.status.taskResults.contains("${field}")`),
        ),
        selector: {
          matchLabels: {
            [TektonResourceLabel.pipelinerun]: pipelineRunName,
          },
        },
      }),
      [pipelineRunName],
    ),
  );

  return React.useMemo(() => {
    if (!loaded || !pipelineRunName) {
      return [null, loaded];
    }

    const [resultObj] = getScanResults(taskRuns);
    return [resultObj, loaded];
  }, [loaded, pipelineRunName, taskRuns]);
};

export const getScanResultsMap = (
  taskRuns: TaskRunKind[],
): { [key: string]: [ScanResults, TaskRunKind[]] } => {
  const scanResults = taskRuns.reduce((acc, scanTaskRun) => {
    const results = isTaskV1Beta1(scanTaskRun)
      ? scanTaskRun?.status?.taskResults
      : scanTaskRun?.status?.results;
    const taskScanResult = results?.find((result) => isCVEScanResult(result));
    const pipelineRunName = scanTaskRun.metadata?.labels?.[PipelineRunLabel.PIPELINERUN_NAME];
    if (!acc[pipelineRunName]) {
      acc[pipelineRunName] = [
        {
          vulnerabilities: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            unknown: 0,
          },
        },
        [],
      ];
    }

    if (taskScanResult) {
      acc[pipelineRunName][1].push(scanTaskRun);
      try {
        const resultObj: ScanResults = JSON.parse(taskScanResult.value);
        acc[pipelineRunName][0].vulnerabilities.critical +=
          resultObj.vulnerabilities?.critical ?? 0;
        acc[pipelineRunName][0].vulnerabilities.high += resultObj.vulnerabilities?.high ?? 0;
        acc[pipelineRunName][0].vulnerabilities.medium += resultObj.vulnerabilities?.medium ?? 0;
        acc[pipelineRunName][0].vulnerabilities.low += resultObj.vulnerabilities?.low ?? 0;
        acc[pipelineRunName][0].vulnerabilities.unknown += resultObj.vulnerabilities?.unknown ?? 0;
      } catch (e) {
        // ignore
      }
    }
    return acc;
  }, {});

  if (Object.values(scanResults).length) {
    return scanResults;
  }
  return null;
};

export const usePLRScanResults = (
  pipelineRunNames: string[],
): [{ [key: string]: unknown }, boolean, string[], unknown] => {
  // Fetch directly from tekton-results because a task result is only present on completed tasks runs.
  const cacheKey = React.useRef('');
  React.useEffect(() => {
    if (pipelineRunNames.length) cacheKey.current = pipelineRunNames.sort().join('|');
  }, [pipelineRunNames]);

  const namespace = useNamespace();
  // Fetch directly from tekton-results because a task result is only present on completed tasks runs.
  const [taskRuns, loaded, error] = useTRTaskRuns(
    pipelineRunNames.length > 0 ? namespace : null,
    React.useMemo(
      () => ({
        filter: OR(
          ...CVE_SCAN_RESULT_FIELDS.map((field) => `data.status.taskResults.contains("${field}")`),
          ...CVE_SCAN_RESULT_FIELDS.map((field) => `data.status.results.contains("${field}")`),
        ),
        selector: {
          matchExpressions: [
            {
              key: `${TektonResourceLabel.pipelinerun}`,
              operator: 'In',
              values: pipelineRunNames?.map((name) => name),
            },
          ],
        },
      }),
      [pipelineRunNames],
    ),
  );

  return React.useMemo(() => {
    if (!loaded || !pipelineRunNames) {
      return [null, loaded, [], error];
    }
    const scanResultsMap = getScanResultsMap(taskRuns);
    return [
      scanResultsMap,
      loaded,
      loaded && pipelineRunNames.sort().join('|') === cacheKey.current ? pipelineRunNames : [],
      error,
    ];
  }, [loaded, pipelineRunNames, taskRuns, error]);
};

export const usePLRVulnerabilities = (
  pipelineRuns: PipelineRunKind[],
): {
  vulnerabilities: { [key: string]: ScanResults };
  fetchedPipelineRuns: string[];
  error: unknown;
} => {
  const pageSize = 30;
  const processedPipelineruns = React.useRef([]);

  const loadedPipelineRunNames = React.useRef([]);
  const [currentPage, setCurrentPage] = React.useState(-1);
  const pipelineRunVulnerabilities = React.useRef({});

  const addLoadedPipelineruns = (pipelienRunNames: string[]): void => {
    loadedPipelineRunNames.current = uniq([...loadedPipelineRunNames.current, ...pipelienRunNames]);
  };

  // enable cache only if the pipeline run has completed
  const [vulnerabilities, vloaded, vlist, error] = usePLRScanResults(
    difference<string>(
      processedPipelineruns.current.slice(
        (currentPage - 1) * pageSize,
        processedPipelineruns.current.length,
      ),
      loadedPipelineRunNames.current,
    ),
  );
  if ((vloaded && vulnerabilities) || error) {
    pipelineRunVulnerabilities.current = merge(
      {},
      vulnerabilities,
      pipelineRunVulnerabilities.current,
    );
  }

  if (vloaded && vlist.length > 0) {
    addLoadedPipelineruns(vlist);
  }

  React.useEffect(() => {
    const totalPlrs = pipelineRuns.length;
    if (totalPlrs > 0) {
      const completedPipelineRuns = pipelineRuns.filter((plr) => !!plr?.status?.completionTime);
      processedPipelineruns.current = uniq(
        completedPipelineRuns.map(({ metadata: { name } }) => name),
      );

      setCurrentPage(Math.round(totalPlrs / pageSize));
    }
  }, [pipelineRuns]);

  return {
    vulnerabilities: pipelineRunVulnerabilities.current,
    fetchedPipelineRuns: loadedPipelineRunNames.current,
    error,
  };
};
