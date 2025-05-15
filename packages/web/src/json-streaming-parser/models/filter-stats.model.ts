import { ApiConformanceScanPathStatsV221 } from './api-conformance-scan-path-stats';

export interface FilterStats {
  filteredPathsStats: ApiConformanceScanPathStatsV221;
  totalTestedCount: number;
  operationsTestedCount: number;
}
