import {
  HttpMethod,
  SemanticVersion,
  ApiConformanceScanHappyPathDetailsV221,
  ApiConformanceScanHappyPathKey,
  ApiConformanceScanHappyPathResponse,
  ApiConformanceScanHappyPathStatsV221,
  ApiConformanceScanIssueV221,
  ApiConformanceScanOperationSkipReasonKeyV221,
  ApiConformanceScanOperationV221,
  ApiConformanceScanOwaspIssues,
  ApiConformanceScanPathV221,
  ApiConformanceScanReportApiResponseAnalysisResponse,
  ApiConformanceScanReportIndexResponse,
  ApiConformanceScanReportOperationResponse,
  ApiConformanceScanReportResponse,
  ApiConformanceScanReportScanLogResponse,
  ApiConformanceScanResponseAnalysisKey,
  ApiConformanceScanResponseAnalysisV221,
  IntegralScanReportIssueStatus,
  OwaspIssueDetail,
  owaspIssueDetails,
  ScanReportV221,
  ScanReportV300NextReason,
  ApiConformanceScanReportState,
  ApiConformanceScanExitCode,
  apiConformanceScanApiConfig,
  Severity,
  StatusCode
} from '../models';
import { StringUtils } from '../utils/string-utils';
import { SemanticVersionUtils } from '../utils/semantic-version.utils';

export class ScanReportV221MappingService {
  // ---------------- NEW FLOW ---------------- //

  // ------------------------------------------ //

  static startMapping(response: any): void {
    const reportData: ApiConformanceScanReportResponse = response.file;
    const taskId = response.taskId;
    let engineVersion: SemanticVersion;
    let reportVersion: SemanticVersion;

    const defaultMinEngineVersion = new SemanticVersion(
      apiConformanceScanApiConfig.conformanceScanReport.engineVersions.operationKeyDashSeparatorMinimumVersion
    );

    const defaultMinReportVersion = new SemanticVersion(
      apiConformanceScanApiConfig.conformanceScanReport.reportVersions.operationKeyDashSeparatorMinimumVersion
    );

    try {
      engineVersion = reportData.scanVersion
        ? // replace "x" with "0" for parsing older/misspelled scan versions, like 1.13.x
          SemanticVersionUtils.parse(reportData.scanVersion.replace('x', '0'))
        : defaultMinEngineVersion;
    } catch (error) {
      throw new Error('failed-to-parse-scan-report-engine-version ,' + error);
    }

    try {
      reportVersion = reportData.scanReportVersion
        ? SemanticVersionUtils.parse(reportData.scanReportVersion)
        : defaultMinReportVersion;
    } catch (error) {
      throw new Error('failed-to-parse-scan-report-schema-version,' + error);
    }

    console.log('%c reportData ', 'text-transform: uppercase; color: white; background-color: green', reportData);
    console.log('%c taskId ', 'text-transform: uppercase; color: white; background-color: green', taskId);
    console.log('%c reportVersion ', 'text-transform: uppercase; color: white; background-color: green', reportVersion);
    console.log('%c engineVersion ', 'text-transform: uppercase; color: white; background-color: green', engineVersion);

    // const meta: Metadata  = {
    //   taskId,
    // date: null,
    // state: undefined,
    // exitCode: undefined,
    // reportVersion,
    // engineVersion,
    // scanVersion: '',
    // requestsCount: 0,
    // issuesCount: 0,
    // isFullReport: false
    // }
    //
    // await dbService.putMetadata(meta).then(() => console.log('%c put data success ', 'text-transform: uppercase; color: white; background-color: green'))
    //   .catch((e: any) => console.log('%c error ', 'text-transform: uppercase; color: white; background-color: red', e))

    const result: ScanReportV221 = this.mapConformanceScanReportResponse(
      reportData,
      taskId,
      reportVersion,
      engineVersion
    );

    console.log('%c result ', 'text-transform: uppercase; color: white; background-color: green', result);
  }

  static mapConformanceScanReportResponse(
    reportData: ApiConformanceScanReportResponse,
    taskId: string,
    reportVersion: SemanticVersion,
    engineVersion: SemanticVersion
  ): ScanReportV221 {
    const startDate =
      reportData.summary && reportData.summary.startDate ? new Date(reportData.summary.startDate) : null;
    const state = reportData.summary && (reportData.summary.state as ApiConformanceScanReportState);
    const exitCode = (reportData.summary && reportData.summary.exitCode) || ApiConformanceScanExitCode.Ok;
    const requestsCount = (reportData.summary && reportData.summary.totalRequest) || 0;
    const issuesCount = (reportData.summary && reportData.summary.issues) || 0;

    // TODO CHECK THIS
    const scanPaths: ApiConformanceScanPathV221[] = Object.keys(reportData.paths || {}).map((path: string) =>
      this.mapConformanceScanPathResponse(
        reportData.paths![path] as StringMap<ApiConformanceScanReportOperationResponse>,
        path,
        reportVersion,
        reportData.index
      )
    );

    // const scanPaths = map<StringMap<StringMap<ApiConformanceScanReportOperationResponse>>, ApiConformanceScanPathV221>(
    //   reportData.paths,
    //   (pathResponse: StringMap<ApiConformanceScanReportOperationResponse>, path: string) =>
    //     this.mapConformanceScanPathResponse(pathResponse, path, reportVersion, reportData.index)
    // );

    const conformanceScanReport: ScanReportV221 = new ScanReportV221({
      taskId: taskId,
      reportVersion: reportVersion,
      engineVersion,
      date: startDate,
      state: state,
      exitCode: exitCode,
      requestsCount: requestsCount,
      issuesCount: issuesCount,
      paths: scanPaths,
      isFullReport: !reportData?.errorsOnly
    });

    return conformanceScanReport;
  }

  static mapConformanceScanPathResponse(
    response: StringMap<ApiConformanceScanReportOperationResponse>,
    path: string,
    reportVersion: SemanticVersion,
    index?: ApiConformanceScanReportIndexResponse
  ): ApiConformanceScanPathV221 {
    const operations: ApiConformanceScanOperationV221[] = Object.keys(response).map((operationMethod: string) =>
      this.mapConformanceScanOperationResponse(response[operationMethod], path, operationMethod, reportVersion, index)
    );

    const scanPath: ApiConformanceScanPathV221 = new ApiConformanceScanPathV221({
      path: path,
      operations: operations
    });

    return scanPath;
  }

  static mapConformanceScanOperationResponse(
    response: ApiConformanceScanReportOperationResponse,
    path: string,
    operationMethod: string,
    reportVersion: SemanticVersion,
    index?: ApiConformanceScanReportIndexResponse
  ): ApiConformanceScanOperationV221 {
    const method = operationMethod.toUpperCase() as HttpMethod;
    const isSkipped = !response.checked;

    const issues = (response.issues || []).map((issueResponse: ApiConformanceScanReportScanLogResponse) =>
      this.mapConformanceScanIssueResponse(issueResponse, path, method, index)
    );

    // soft casting - reasons list can be extended later
    const operationSkipReasonKey = this.mapApiConformanceScanOperationKeyResponse(
      response.reason || '',
      reportVersion
    ) as ApiConformanceScanOperationSkipReasonKeyV221;

    let happyPathStats: ApiConformanceScanHappyPathStatsV221 | null = null;
    if (response.happyPath) {
      happyPathStats = {
        isFailed: !(response.happyPath.key === ApiConformanceScanHappyPathKey.HappyPathSuccess)
      };
    }

    let happyPathDetails: ApiConformanceScanHappyPathDetailsV221 | null = null;

    if (operationSkipReasonKey === ApiConformanceScanOperationSkipReasonKeyV221.HappyPathFailed) {
      happyPathDetails = this.mapApiConformanceScanHappyPathDetailsResponse(response?.happyPath || null, reportVersion);
    }

    const skipReasonDetails = (response.skipReasonDetails || []).filter(
      (item: string) => !StringUtils.isNullOrWhitespace(item)
    );

    const scanOperation = new ApiConformanceScanOperationV221({
      method: method,
      path: path,
      isSkipped: isSkipped,
      skipReason: operationSkipReasonKey,
      skipReasonDetails: skipReasonDetails,
      happyPathDetails: happyPathDetails,
      totalRequestCount: response.totalRequest || 0,
      totalExpected: response.totalExpected,
      totalUnexpected: response.totalUnexpected,
      totalFailure: response.totalFailure,
      issues: issues,
      happyPathStats,
      reason: response.reason as ScanReportV300NextReason
    });

    return scanOperation;
  }

  private static mapConformanceScanIssueResponse(
    response: ApiConformanceScanReportScanLogResponse,
    path: string,
    method: HttpMethod,
    index?: ApiConformanceScanReportIndexResponse
  ): ApiConformanceScanIssueV221 {
    const hasIndex = !!index;

    const injectionKey =
      (hasIndex ? index.injectionKeys[response.injectionKey as number] : (response.injectionKey as string)) || '';

    const injectionDescriptionWithPlaceholders =
      (hasIndex
        ? index.injectionDescriptions[response.injectionDescription as number]
        : (response.injectionDescription as string)) || '';

    const injectionDescription = this.mapDescriptionResponse(
      injectionDescriptionWithPlaceholders,
      response.injectionDescriptionParams || []
    );

    const responseAnalysisList: ApiConformanceScanResponseAnalysisV221[] = (response.apiResponseAnalysis || []).map(
      (responseAnalysisItem: ApiConformanceScanReportApiResponseAnalysisResponse) => {
        let responseKeyValue: ApiConformanceScanResponseAnalysisKey | number;

        if (responseAnalysisItem) {
          responseKeyValue = responseAnalysisItem.responseKey;
        } else {
          responseKeyValue = response.responseKey;
        }

        const responseKey: ApiConformanceScanResponseAnalysisKey | number = hasIndex
          ? index?.['responseKeys'][responseKeyValue as number]
          : (responseKeyValue as ApiConformanceScanResponseAnalysisKey);

        let responseDescriptionWithPlaceholdersValue: string | number;
        let responseDescriptionParams: string[];

        if (responseAnalysisItem) {
          responseDescriptionWithPlaceholdersValue = responseAnalysisItem.responseDescription;
          responseDescriptionParams = responseAnalysisItem.responseDescriptionParams || [];
        } else {
          responseDescriptionWithPlaceholdersValue = response.responseDescription;
          responseDescriptionParams = response.responseDescriptionParams || [];
        }

        const responseDescriptionWithPlaceholders =
          (hasIndex
            ? index?.['responseDescriptions'][responseDescriptionWithPlaceholdersValue as number]
            : (responseDescriptionWithPlaceholdersValue as string)) || '';

        const responseDescription = this.mapDescriptionResponse(
          responseDescriptionWithPlaceholders,
          responseDescriptionParams
        );

        return { responseKey, responseDescription };
      }
    );

    const requestContentType =
      (hasIndex
        ? index.contentTypes[response.requestContentType as number]
        : (response.requestContentType as string)) || '';

    const responseContentType =
      (hasIndex
        ? index.contentTypes[response.responseContentType as number]
        : (response.responseContentType as string)) || '';

    const jsonPointer =
      (hasIndex ? index.jsonPointers[response.jsonPointer as number] : (response.jsonPointer as string)) || '';

    let responseBody: string;
    if (!StringUtils.isNullOrEmpty(response.responseBody)) {
      try {
        responseBody = StringUtils.parseBase64ToUTF(response.responseBody);
      } catch (error) {
        responseBody = '';
        console.log(`Failed to parse API Conformance Scan issue body: ${responseBody}`, error);
      }
    } else {
      responseBody = '';
    }

    if (!responseBody && !!response.responseHttp) {
      responseBody = response.responseHttp.split(apiConformanceScanApiConfig.responseHeaderAndBodySeparator)[1];
    }
    /** Additional body extraction flow for the latest non-incremented iteration of the scan report engine (the body property is always equal to `null` in it but full `responseHttp` is added instead) */
    // if (!StringUtils.isNullOrEmpty(response.responseHttp)) {
    //   try {
    //     const responseHttp = StringUtils.parseBase64ToUTF(response.responseHttp);
    //     if (!responseBody && !!responseHttp) {
    //       responseBody = responseHttp.split(apiConformanceScanApiConfig.responseHeaderAndBodySeparator)[1];
    //     }
    //   } catch (error) {
    //     console.log(`Failed to parse API Conformance Scan issue HTTP content: ${response.responseHttp}`,
    //       error);
    //   }
    // }

    const injectionStatus = responseAnalysisList[0]?.responseKey as ApiConformanceScanResponseAnalysisKey;

    const isContractConforming: boolean = responseAnalysisList.length < 2;

    const owaspMapping = response.owaspMapping;

    const owaspDetail = owaspMapping
      ? owaspIssueDetails.find((item: OwaspIssueDetail) => item.id === response.owaspMapping)
      : owaspIssueDetails.find((item: OwaspIssueDetail) => item.id === ApiConformanceScanOwaspIssues.None);

    let integralStatus: IntegralScanReportIssueStatus;

    if (isContractConforming) {
      switch (injectionStatus) {
        case ApiConformanceScanResponseAnalysisKey.Expected:
          integralStatus = IntegralScanReportIssueStatus.CodeExpectedConformitySuccess;
          break;
        case ApiConformanceScanResponseAnalysisKey.Unexpected:
          integralStatus = IntegralScanReportIssueStatus.CodeUnexpectedConformitySuccess;
          break;
        case ApiConformanceScanResponseAnalysisKey.Successful:
          integralStatus = IntegralScanReportIssueStatus.CodeIncorrectConformitySuccess;
          break;
      }
    } else {
      switch (injectionStatus) {
        case ApiConformanceScanResponseAnalysisKey.Expected:
          integralStatus = IntegralScanReportIssueStatus.CodeExpectedConformityFailure;
          break;
        case ApiConformanceScanResponseAnalysisKey.Unexpected:
          integralStatus = IntegralScanReportIssueStatus.CodeUnexpectedConformityFailure;
          break;
        case ApiConformanceScanResponseAnalysisKey.Successful:
          integralStatus = IntegralScanReportIssueStatus.CodeIncorrectConformityFailure;
          break;
      }
    }

    const expected = response.expected;

    const scanIssue = new ApiConformanceScanIssueV221({
      id: response.id,
      path,
      method,
      injectionKey,
      injectionDescription,
      responseAnalysisList,
      criticality: response.criticality || Severity.None,
      owaspMapping,
      owaspDetail,
      jsonPointer,
      requestDate: response.requestDate ? new Date(response.requestDate) : '',
      requestContentType,
      requestBodyLength: response.requestBodyLength || 0,
      url: response.url || '',
      curl: response.curl || '',
      responseTime: response.responseTime || 0,
      responseHttpStatusCode: response.responseHttpStatusCode || StatusCode.Unknown,
      responseContentType,
      responseBodyLength: response.responseBodyLength || 0,
      responseBody,
      injectionStatus,
      isContractConforming,
      integralStatus,
      expected
    });

    return scanIssue;
  }

  static mapDescriptionResponse(descriptionResponse: string, params: string[]) {
    const description = StringUtils.replacePlaceholders(
      descriptionResponse,
      apiConformanceScanApiConfig.conformanceScanReport.mappings.placeholder,
      params
    );

    return description;
  }

  static mapApiConformanceScanOperationKeyResponse(response: string, reportVersion: SemanticVersion): string {
    if (StringUtils.isNullOrEmpty(response)) {
      return '';
    }

    const minimumVersion = new SemanticVersion({
      major:
        apiConformanceScanApiConfig.conformanceScanReport.reportVersions.operationKeyDashSeparatorMinimumVersion.major,
      minor:
        apiConformanceScanApiConfig.conformanceScanReport.reportVersions.operationKeyDashSeparatorMinimumVersion.minor,
      patch:
        apiConformanceScanApiConfig.conformanceScanReport.reportVersions.operationKeyDashSeparatorMinimumVersion.patch
    });

    const isOldReport = SemanticVersionUtils.compare(reportVersion, minimumVersion) < 0;

    let key: string;
    if (isOldReport) {
      key = response.replace(/\./g, '-').toLowerCase();
    } else {
      key = response;
    }

    return key;
  }

  static mapApiConformanceScanHappyPathDetailsResponse(
    happyPathResponse: ApiConformanceScanHappyPathResponse | null,
    reportVersion: SemanticVersion
  ): ApiConformanceScanHappyPathDetailsV221 | null {
    if (!happyPathResponse) {
      return null;
    }

    let happyPathResponseHttp: string;
    if (!StringUtils.isNullOrEmpty(happyPathResponse.responseHttp)) {
      try {
        happyPathResponseHttp = StringUtils.parseBase64ToUTF(happyPathResponse.responseHttp);
      } catch (error) {
        happyPathResponseHttp = '';
      }
    } else {
      happyPathResponseHttp = '';
    }

    const happyPathKey = this.mapApiConformanceScanOperationKeyResponse(
      happyPathResponse.key,
      reportVersion
    ) as ApiConformanceScanHappyPathKey;

    const happyPathDetails = new ApiConformanceScanHappyPathDetailsV221({
      // soft casting - happy path list can be extended later
      happyPathKey: happyPathKey,
      curl: happyPathResponse.curl,
      isCurlBodySkipped: happyPathResponse.curlBodySkipped,
      responseHttpStatusCode: happyPathResponse.responseHttpStatusCode,
      responseContentType: happyPathResponse.responseContentType,
      responseBodyLength: happyPathResponse.responseBodyLength,
      responseHttp: happyPathResponseHttp,
      // TODO: Use indexes + placeholders
      responseKey: happyPathResponse.responseKey as string,
      // TODO: Use indexes + placeholders
      responseDescription: happyPathResponse.responseDescription as string
    });

    return happyPathDetails;
  }
}
