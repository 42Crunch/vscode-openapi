/* eslint-disable */

// Auto generated from JSON Schema

// TODO: provide for versioning of the models contained here (with respect to scanReportVersion)

import { ApiConformanceScanHappyPathKey } from './api-conformance-scan-happy-path-key';
import { ApiConformanceScanResponseAnalysisKey } from './api-conformance-scan-response-analysis-key';
import { ApiConformanceScanOwaspIssues } from './api-conformance-scan-owasp-issues';
import { ScanReportExpectedCodeInfo } from './scan-report-expected-code-info';

export enum ScanReportV300NextReason {
  OperationUnsupported = 'operation-content-type-not-supported',
  OperationSkipped = 'operation-skipped',
  OperationConfigurationInvalid = 'operation-configuration-invalid',
  OperationHappyPathFailed = 'operation-happy-path-failed'
}


/**
 * V2.1.0 scan report structure
 */
export interface ApiConformanceScanReportResponse {
  /**
   * Indicates if the report is indexed or not.
   */
  indexed: boolean;
  /**
   * Index for store reusable information.
   * The information can be reused elsewhere by specifying the index of the item to be reused.
   */
  index?: ApiConformanceScanReportIndexResponse;
  /**
   * The version of Conformance Scan that generated the report (corresponds to current platform version).
   */
  scanVersion: string;
  /**
   * The version of Conformance Scan currently used report specification (scan engine).
   */
  scanReportVersion: string;
  /**
   * The commit ID of the scan version that generated the report. This is only used for troublshooting.
   */
  commit: string;
  /**
   * The global host URL used to send request. Can be overwritten locally for each operation.
   */
  host: string;
  /**
   * If this flag is set to 'true', only errors caught in the scan are included in the 'issues' array
   * of the 'operationReport' object.
   * If set to 'false', all sent requests are included in the 'issues' array,
   * even the ones where API successfully answered.
   */
  errorsOnly: boolean;

  summary: ApiConformanceScanReportSummaryResponse;
  /**
   * A map of scanned paths.
   */
  paths?: {
    /**
     * A map of scanned operations.
     *
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "/".
     */
    [k: string]: {
      get?: ApiConformanceScanReportOperationResponse;
      put?: ApiConformanceScanReportOperationResponse;
      post?: ApiConformanceScanReportOperationResponse;
      delete?: ApiConformanceScanReportOperationResponse;
      options?: ApiConformanceScanReportOperationResponse;
      head?: ApiConformanceScanReportOperationResponse;
      patch?: ApiConformanceScanReportOperationResponse;
      trace?: ApiConformanceScanReportOperationResponse;
      [k: string]: any;
    };
  };
}

/**
 * Index for store reusable information.
 * The information can be reused elsewhere by specifying the index of the item to be reused.
 */
export interface ApiConformanceScanReportIndexResponse {
  /**
   * An array of reusable JSON pointers.
   */
  jsonPointers: string[];
  /**
   * An array of reusable content types.
   */
  contentTypes: string[];
  /**
   * An array of reusable injection keys.
   */
  injectionKeys: string[];
  /**
   * An array of reusable injection descriptions.
   */
  injectionDescriptions: string[];
  /**
   * An array of reusable response keys.
   */
  responseKeys: ApiConformanceScanResponseAnalysisKey[];
  /**
   * An array of reusable response descriptions.
   */
  responseDescription: string[];
  [k: string]: any;
}

/**
 * A summary of the scan report.
 */
export interface ApiConformanceScanReportSummaryResponse {
  startDate: string;
  endDate: string;
  openapiId: string;
  state: string;
  exitCode: number;
  processingError: string;
  totalRequest: number;
  criticality: number;
  issues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  infoIssues: number;
}

/**
 * A report of the scanned operation.
 */
export class ApiConformanceScanReportOperationResponse {
  /**
   * If set to 'true', the operation was successfully scanned.
   * If set to 'false', there was a problem during the initialization of the operation and it was not scanned.
   */
  checked: boolean;
  /**
   * If the property 'checked' is 'false', this property provides more details on why the operation was not scanned.
   */
  reason?: string | ScanReportV300NextReason;
  /**
   * The cURL of the happy path request. The body can be omitted if it exceeds the size limit.
   * In this case, the property 'curlBodySkipped' is set to 'true'.
   */
  curlHappyPath?: string;

  skipReasonDetails?: string[];

  happyPath?: ApiConformanceScanHappyPathResponse | null;
  /**
   * If this property is 'true', the body was omitted from the cURL request because it exceeds the size limit.
   */
  curlBodySkipped?: boolean;
  /**
   * The total number of requests generated for the operation.
   */
  totalRequest: number;
  /**
   * An array of scan issues. The property 'errorsOnly' in the root report object controls which
   * issues are included in the report: 'true' to include only errors, 'false' to include all sent requests.
   * In the latter case, the length of the 'issues' array is equal to the property 'totalRequest'.
   */
  issues?: ApiConformanceScanReportScanLogResponse[];

  totalExpected: number;
  totalUnexpected: number;
  totalFailure: number;

  [k: string]: any;

  constructor({
      checked,
      reason,
      curlHappyPath,
      skipReasonDetails,
      happyPath,
      curlBodySkipped,
      totalRequest,
      issues,
      totalExpected,
      totalUnexpected,
      totalFailure
    }: Partial<ApiConformanceScanReportOperationResponse> = {})
  {
    this.checked = checked || false;
    this.reason = reason || '';
    this.curlHappyPath = curlHappyPath || '';
    this.skipReasonDetails = skipReasonDetails || [];
    this.happyPath = happyPath || null;
    this.curlBodySkipped = curlBodySkipped || false;
    this.totalRequest = totalRequest || 0;
    this.issues = issues || [];
    this.totalExpected = totalExpected || 0;
    this.totalUnexpected = totalUnexpected || 0;
    this.totalFailure = totalFailure || 0;
  }
}

/**
 * The details of an injection that the scan generated and sent to the API.
 */
export interface ApiConformanceScanReportScanLogResponse {
  /**
   * The unique ID of the request present in the header 'x-scan-transactionid'.
   */
  id: string;
  /**
   * The key referring to the injection that the scan performed. Can be indexed.
   */
  injectionKey: string | number;
  /**
   * The description of the injection. Can be indexed.
   */
  injectionDescription: string | number;
  /**
   * This property is present if the report is indexed, and it lists the parameters to build
   * the property 'injectionDescription'. For example, for a description 'Hello World',
   *  the 'injectionDescription' will be an index pointing to 'Hello ‘%s’', and the
   * variable ‘%s’ is populated from the item 'World' in the 'injectionDescriptionParams'.
   */
  injectionDescriptionParams?: string[];
  /**
   * @deprecated
   * The key referring to the API's response to the injection.
   */
  responseKey: ApiConformanceScanResponseAnalysisKey | number;
  /**
   * @deprecated
   * A description of the response. Can be indexed.
   */
  responseDescription: string | number;
  /**
   * @deprecated
   * This property is present if the report is indexed, and it lists the parameters
   *  to build the property 'responseDescription'. For example, for a description 'Hello World',
   * the 'responseDescription' will be an index pointing to 'Hello ‘%s’', and the variable ‘%s’
   * is populated from the item 'World' in the 'responseDescriptionParams'.
   */
  responseDescriptionParams?: string[];
  /**
   * The final severity level for the spotted issue. The severity level is calculated from
   *  the combination of the sensitivity of the operation as defined in the OpenAPI definition,
   *  and the severity of the security risk that the injection issue imposes.
   */
  criticality: number;
  /**
   * OWASP Top 10 list map
   */
  owaspMapping: ApiConformanceScanOwaspIssues;
  /**
   * The JSON pointer of the scanned object in the OpenAPI definition file. Can be indexed.
   */
  jsonPointer: string | number;
  /**
   * The timestamp when the scan sent the request to the API.
   */
  requestDate: string;
  /**
   * The content type of the request body. The string is empty if no body is present. Can be indexed.
   */
  requestContentType: string | number;
  /**
   * The length of the body in the request.
   */
  requestBodyLength: number;
  /**
   * The full URL used in the injection, including query parameters.
   */
  url: string;
  /**
   * The cURL of the sent request. The body can be omitted if it exceeds the size limit.
   * In this case, the property 'curlBodySkipped' is set to 'true'.
   */
  curl: string;
  /**
   * If this property is 'true', the body was omitted from the cURL request because it exceeds the size limit.
   */
  curlBodySkipped?: boolean;
  /**
   * The time elapsed (in milliseconds) between sending the request and receiving the response.
   */
  responseTime: number;
  /**
   * The HTTP status code received from the API (between [100-999]).
   */
  responseHttpStatusCode?: number;
  /**
   * The content type of the request body in the received response. Can be indexed.
   */
  responseContentType: string | number;
  /**
   * The length of the body in the received response.
   */
  responseBodyLength: number;
  /**
   * Base64 body present in the request, can be omitted if it exceeds the size limit.
   * Ignored as `null` in the latest non-incremented subset of this version, and in the next scan versions
   */
  responseBody: string;
  /**
   * Base64 full HTTP content of the response present in the request
   * v2.2.3+ specific property (no targeted report version increment)
   */
  responseHttp: string;
  /**
   * Integral property responsible for bearing information about the response keys and their descriptions
   */
  apiResponseAnalysis?: ApiConformanceScanReportApiResponseAnalysisResponse[];
  /**
   * v2.2.3+ specific property for expected injection status codes
   */
  expected: ScanReportExpectedCodeInfo;
}

export interface ApiConformanceScanHappyPathResponse {
  key: ApiConformanceScanHappyPathKey | string;
  curl: string;
  curlBodySkipped: boolean;
  responseHttpStatusCode: number;
  responseContentType: string;
  responseBodyLength: number;
  responseHttp: string;
  responseKey: string | number;
  responseDescription: string | number;
}

export interface ApiConformanceScanReportScanLogItemResponse {
  level: string;
  time: string;
  message: string;
}

export interface ApiConformanceScanReportApiResponseAnalysisResponse {
  responseKey: ApiConformanceScanResponseAnalysisKey | number;
  responseDescription: string | number;
  responseDescriptionParams?: string[];
}
