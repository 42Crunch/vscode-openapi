import { ApiConformanceScanIssueV221 } from './api-conformance-scan-issue';
import { ApiConformanceScanOperationSkipReasonKeyV221 } from './api-conformance-scan-operation-skip-reason-key';
import { ApiConformanceScanHappyPathDetailsV221 } from './api-conformance-scan-happy-path-details';
import { ApiConformanceScanHappyPathStatsV221 } from './api-conformance-scan-happy-path-stats';
import { HttpMethod } from './http-method';
import { ScanReportV300NextReason } from './api-conformance-scan-report-response';

export class ApiConformanceScanOperationV221 {
  method: HttpMethod | null;
  path: string;
  isSkipped: boolean;
  skipReason: ApiConformanceScanOperationSkipReasonKeyV221 | null;
  skipReasonDetails: string[];
  happyPathDetails: ApiConformanceScanHappyPathDetailsV221 | null;
  happyPathStats: ApiConformanceScanHappyPathStatsV221 | null;
  totalRequestCount: number;
  totalExpected: number;
  totalUnexpected: number;
  totalFailure: number;
  issues: ApiConformanceScanIssueV221[];
  reason: ScanReportV300NextReason | null;

  constructor({
    method,
    path,
    isSkipped,
    skipReason,
    skipReasonDetails,
    happyPathDetails,
    happyPathStats,
    totalRequestCount,
    totalExpected,
    totalUnexpected,
    totalFailure,
    issues,
    reason
  }: Partial<ApiConformanceScanOperationV221> = {}) {
    this.method = method || null;
    this.path = path || '';
    this.isSkipped = isSkipped || false;
    this.skipReason = skipReason || null;
    this.skipReasonDetails = skipReasonDetails || [];
    this.happyPathDetails = happyPathDetails || null;
    this.happyPathStats = happyPathStats || null;
    this.totalRequestCount = totalRequestCount || 0;
    this.totalExpected = totalExpected || 0;
    this.totalUnexpected = totalUnexpected || 0;
    this.totalFailure = totalFailure || 0;
    this.issues = issues || [];
    this.reason = reason || null;
  }
}
