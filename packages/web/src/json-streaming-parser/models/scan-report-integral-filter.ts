import { ApiConformanceScanIssuesFilterType } from './api-conformance-scan-issues-filter-type';
import { ApiConformanceScanOperationV221 } from './api-conformance-scan-operation';
import { ScanReportStatsFilterCriteria } from './scan-report-stats-filter-criteria';
import { HttpMethod } from './http-method';
import { Severity } from './severity';
import { SupportedOwaspTopTenIssueList } from './api-conformance-scan-owasp-issues';

export class ScanReportIntegralFilter {
  readonly hierarchicalLevelFilterType: ApiConformanceScanIssuesFilterType;
  readonly path: string;
  readonly httpMethod: HttpMethod;
  readonly statsFilter: ScanReportStatsFilterCriteria;
  readonly skippedOperation: ApiConformanceScanOperationV221;
  readonly owaspVulnerabilityFilter: SupportedOwaspTopTenIssueList[];
  readonly severityFilter: Severity[];

  constructor({
    hierarchicalLevelFilterType,
    path,
    httpMethod,
    statsFilter,
    skippedOperation,
    owaspVulnerabilityFilter,
    severityFilter
  }: Partial<ScanReportIntegralFilter> = {}) {
    this.hierarchicalLevelFilterType = hierarchicalLevelFilterType || ApiConformanceScanIssuesFilterType.SubPaths;
    this.path = path || '';
    this.httpMethod = httpMethod;
    this.statsFilter = statsFilter || null;
    this.skippedOperation = skippedOperation || null;
    this.owaspVulnerabilityFilter = owaspVulnerabilityFilter || [];
    this.severityFilter = severityFilter || [];
  }
}
