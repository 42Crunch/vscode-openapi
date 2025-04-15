import { ScanReportExpectedCodeInfo } from './scan-report-expected-code-info';
import { HttpMethod } from './http-method';
import { Severity } from './severity';
import { StatusCode } from './status-code';
import { IntegralScanReportIssueStatus } from './integral-scan-report-issue-status';
import { ApiConformanceScanResponseAnalysisKey } from './api-conformance-scan-response-analysis-key';
import { ApiConformanceScanResponseAnalysisV221 } from './api-conformance-scan-response-analysis';
import { SupportedOwaspTopTenIssueList, OwaspIssueDetail } from './api-conformance-scan-owasp-issues';

export class ApiConformanceScanIssueV221 {
  readonly id: string;
  readonly path: string;
  readonly method: HttpMethod | undefined;
  readonly injectionKey: string;
  readonly injectionDescription: string;
  readonly injectionStatus: ApiConformanceScanResponseAnalysisKey | null;
  /** introduced instead of responseKey and responseDescription marked for deprecation */
  readonly responseAnalysisList: ApiConformanceScanResponseAnalysisV221[];
  /** @deprecated */
  readonly responseKey: string;
  /** @deprecated */
  readonly responseDescription: string;
  readonly criticality: Severity;
  /** old property (standard 2019) for backward compatibility mapped to UI enum */
  readonly owaspMapping: SupportedOwaspTopTenIssueList;
  /** new property with details by different years (if present) */
  readonly owaspIssuesFound: OwaspIssueDetail[];
  readonly isContractConforming: boolean;
  readonly integralStatus: IntegralScanReportIssueStatus | null;
  readonly jsonPointer: string;
  readonly requestDate: Date | string;
  readonly requestContentType: string;
  readonly requestBodyLength: number;
  readonly url: string;
  readonly curl: string;
  readonly responseTime: number;
  readonly responseHttpStatusCode: StatusCode | null;
  readonly responseContentType: string;
  readonly responseBodyLength: number;
  readonly responseBody: string;
  /** Only for scan report version 2.2.3 and later (null for earlier versions - 2.2.1 and 2.2.2) */
  readonly expected: ScanReportExpectedCodeInfo | null;

  constructor({
    id,
    path,
    method,
    injectionKey,
    injectionDescription,
    injectionStatus,
    responseAnalysisList,
    responseKey,
    responseDescription,
    criticality,
    owaspIssuesFound,
    owaspMapping,
    isContractConforming,
    integralStatus,
    jsonPointer,
    requestDate,
    requestContentType,
    requestBodyLength,
    url,
    curl,
    responseTime,
    responseHttpStatusCode,
    responseContentType,
    responseBodyLength,
    responseBody,
    expected
  }: Partial<ApiConformanceScanIssueV221> = {}) {
    this.id = id || '';
    this.path = path || '';
    this.method = method || undefined;
    this.injectionKey = injectionKey || '';
    this.injectionDescription = injectionDescription || '';
    this.injectionStatus = injectionStatus || null;
    this.responseAnalysisList = responseAnalysisList || [];
    this.responseKey = responseKey || '';
    this.responseDescription = responseDescription || '';
    this.criticality = criticality || Severity.None;
    this.owaspMapping = owaspMapping || SupportedOwaspTopTenIssueList.None;
    this.owaspIssuesFound = owaspIssuesFound || null;
    this.isContractConforming = isContractConforming || false;
    this.integralStatus = integralStatus || null;
    this.jsonPointer = jsonPointer || '';
    this.requestDate = requestDate || '';
    this.requestContentType = requestContentType || '';
    this.requestBodyLength = requestBodyLength || 0;
    this.url = url || '';
    this.curl = curl || '';
    this.responseTime = responseTime || 0;
    this.responseHttpStatusCode = responseHttpStatusCode || null;
    this.responseContentType = responseContentType || '';
    this.responseBodyLength = responseBodyLength || 0;
    this.responseBody = responseBody || '';
    this.expected = expected || null;
  }
}
