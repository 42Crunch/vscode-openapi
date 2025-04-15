import { ApiConformanceScanPathV221 } from './api-conformance-scan-path';
import { SemanticVersion } from './semantic-version';
import { ApiConformanceScanReportState } from './api-conformance-scan-report-state';
import { ApiConformanceScanExitCode } from './api-conformance-scan-exit-code';

export class ScanReportV221 {
  readonly taskId: string;
  readonly date: Date | null;
  readonly state: ApiConformanceScanReportState;
  readonly exitCode: ApiConformanceScanExitCode;
  readonly reportVersion: SemanticVersion;
  readonly engineVersion: SemanticVersion;
  readonly scanVersion: string;
  readonly requestsCount: number;
  readonly issuesCount: number;
  readonly paths: ApiConformanceScanPathV221[];
  readonly isFullReport: boolean;

  constructor({
    taskId,
    date,
    state,
    exitCode,
    reportVersion,
    engineVersion,
    scanVersion,
    requestsCount,
    issuesCount,
    paths,
    isFullReport
  }: Partial<ScanReportV221> = {}) {
    this.taskId = taskId || '';
    this.date = date || null;
    this.state = state || ApiConformanceScanReportState.Finished;
    this.exitCode = exitCode || ApiConformanceScanExitCode.Ok;
    this.reportVersion = reportVersion || new SemanticVersion();
    this.engineVersion = engineVersion || new SemanticVersion();
    this.scanVersion = scanVersion || '';
    this.requestsCount = requestsCount || 0;
    this.issuesCount = issuesCount || 0;
    this.paths = paths || [];
    this.isFullReport = isFullReport ?? true;
  }
}
