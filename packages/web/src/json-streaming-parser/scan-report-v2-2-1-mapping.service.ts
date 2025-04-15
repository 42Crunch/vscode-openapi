import { SemanticVersionUtils } from './utils/semantic-version.utils';
import { StringUtils } from './utils/string-utils';
import {
  apiConformanceScanApiConfig,
  SemanticVersion,
  ApiConformanceScanHappyPathResponse,
  ApiConformanceScanHappyPathDetailsV221,
  ApiConformanceScanIssueV221,
  ScanReportIntegralFilter,
  ApiConformanceScanHappyPathKey,
  ApiConformanceScanIssuesFilterType,
  IntegralScanReportIssueStatus,
  ScanReportStatsFilterCriteria,
  SupportedOwaspTopTenIssueList,
  ApiConformanceScanOperationV221,
  ApiConformanceScanPathV221,
  ApiConformanceScanResponseAnalysisKey,
  HttpMethod,
  ApiConformanceScanPathStatsV221,
  MetadataItem,
  MetadataKey,
  reportMetadataMap
} from './models';

export class ScanReportV221MappingService {
  static trimEnd(value: string, charToRemove: string): string {
    const splittedString: string[] = value.split('');

    if (splittedString[splittedString.length - 1] === charToRemove) {
      splittedString.pop();
    }

    return splittedString.join('');
  }

  static isNotEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length > 0;
    } else if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    } else {
      return true;
    }
  }

  static filterIssues(
    issue: ApiConformanceScanIssueV221,
    searchFilter: string = '',
    scanIssuesFilter: ScanReportIntegralFilter = new ScanReportIntegralFilter()
  ): boolean {
    let isMatched: boolean = true;

    if (searchFilter) {
      const reg: RegExp = new RegExp(`${searchFilter}`, 'i');

      isMatched =
        reg.test(issue.method) ||
        reg.test(issue.path) ||
        reg.test(`${issue.owaspMapping}`) ||
        reg.test(issue.injectionStatus) ||
        reg.test(`${issue.responseAnalysisList[0]?.responseKey || ''}`) ||
        reg.test(`${issue.responseAnalysisList[0]?.responseDescription || ''}`) ||
        reg.test(`${issue.isContractConforming}`) ||
        reg.test(`${issue.criticality}`);
    }

    if (!isMatched) {
      return false;
    }

    if (!scanIssuesFilter) {
      return true;
    }

    const { path, httpMethod, hierarchicalLevelFilterType, statsFilter, owaspVulnerabilityFilter, severityFilter } =
      scanIssuesFilter;
    // first level - hierarchical filter trimming (paths/operations)

    const isStrictPathMatch = hierarchicalLevelFilterType !== ApiConformanceScanIssuesFilterType.SubPaths;

    const trimmedPath = ScanReportV221MappingService.trimEnd(path, '/');

    const isEmptyPath = StringUtils.isNullOrEmpty(trimmedPath);
    const isEmptyHttpMethod = StringUtils.isNullOrEmpty(httpMethod);

    if (isEmptyPath && isEmptyHttpMethod && !isStrictPathMatch) {
      isMatched = true;
    } else {
      const isPathMatched = ScanReportV221MappingService.checkIsPathMatched(
        issue.path || '',
        path || '',
        isStrictPathMatch
      );
      const isHttpMethodMatched = isEmptyHttpMethod || issue.method === httpMethod;

      isMatched = isPathMatched && isHttpMethodMatched;
    }

    if (!isMatched) {
      return false;
    }
    // second level - stats filter trimming (different injection status combinations)

    if (statsFilter) {
      switch (statsFilter) {
        case ScanReportStatsFilterCriteria.Owasp:
          isMatched =
            !!issue.owaspIssuesFound?.length &&
            issue.owaspIssuesFound.every((item) => item.id !== SupportedOwaspTopTenIssueList.None);
          break;
        case ScanReportStatsFilterCriteria.OperationFailed:
          isMatched = false;
          break;
        case ScanReportStatsFilterCriteria.CodeIncorrectConformityFailure:
          isMatched = issue.integralStatus === IntegralScanReportIssueStatus.CodeIncorrectConformityFailure;
          break;
        case ScanReportStatsFilterCriteria.CodeUnexpectedConformityFailure:
          isMatched = issue.integralStatus === IntegralScanReportIssueStatus.CodeUnexpectedConformityFailure;
          break;
        case ScanReportStatsFilterCriteria.CodeUnexpectedConformitySuccess:
          isMatched = issue.integralStatus === IntegralScanReportIssueStatus.CodeUnexpectedConformitySuccess;
          break;
        case ScanReportStatsFilterCriteria.CodeExpectedConformityFailure:
          isMatched = issue.integralStatus === IntegralScanReportIssueStatus.CodeExpectedConformityFailure;
          break;
        case ScanReportStatsFilterCriteria.CodeExpectedConformitySuccess:
          isMatched = issue.integralStatus === IntegralScanReportIssueStatus.CodeExpectedConformitySuccess;
          break;
        case ScanReportStatsFilterCriteria.CodeIncorrectConformitySuccess:
          isMatched = issue.integralStatus === IntegralScanReportIssueStatus.CodeIncorrectConformitySuccess;
          break;
      }
    }

    if (!isMatched) {
      return false;
    }

    // third level - OWASP vulnerabilities filter trimming
    if (ScanReportV221MappingService.isNotEmpty(owaspVulnerabilityFilter)) {
      isMatched = owaspVulnerabilityFilter.some((item) => item === issue.owaspMapping);
    }

    if (!isMatched) {
      return false;
    }

    // forth level - issue severity (criticality) filter trimming
    if (ScanReportV221MappingService.isNotEmpty(severityFilter)) {
      isMatched = severityFilter.some((item) => item === issue.criticality);
    }

    return isMatched;
  }

  static filterApiConformanceScanOperations(
    operation: ApiConformanceScanOperationV221,
    searchFilter: string = '',
    scanIssuesFilter: ScanReportIntegralFilter = new ScanReportIntegralFilter()
  ): boolean {
    let isMatched: boolean = true;

    if (searchFilter) {
      isMatched =
        operation.method.toLowerCase().includes(searchFilter.toLowerCase()) ||
        operation.path.toLowerCase().includes(searchFilter.toLowerCase()) ||
        operation.skipReasonDetails.some((reason: string) => reason.toLowerCase().includes(searchFilter.toLowerCase()));
    }

    if (!isMatched) {
      return false;
    }

    if (scanIssuesFilter.skippedOperation) {
      isMatched =
        operation.method === scanIssuesFilter.skippedOperation.method &&
        operation.path === scanIssuesFilter.skippedOperation.path;
    }

    if (!isMatched) {
      return false;
    }

    if (scanIssuesFilter.hierarchicalLevelFilterType === ApiConformanceScanIssuesFilterType.Path) {
      isMatched = operation.path === scanIssuesFilter.path;
    }

    return isMatched;
  }

  static filterApiConformanceScanPaths(
    scanPathToCheck: ApiConformanceScanPathV221,
    path: string = '',
    httpMethod?: HttpMethod,
    isStrictPathMatch: boolean = false
  ): boolean {
    const trimmedPath = this.trimEnd(path, '/');

    const isEmptyPath = StringUtils.isNullOrEmpty(trimmedPath);
    const isEmptyHttpMethod = StringUtils.isNullOrEmpty(httpMethod);

    if (isEmptyPath && isEmptyHttpMethod && !isStrictPathMatch) {
      return true;
    }

    const isPathMatched = this.checkIsPathMatched(scanPathToCheck.path || '', path || '', isStrictPathMatch);

    if (!isPathMatched) {
      return false;
    }

    if (isEmptyHttpMethod) {
      return true;
    }

    const filteredScanOperation = scanPathToCheck.operations.find((scanOperation: ApiConformanceScanOperationV221) =>
      StringUtils.equalsIgnoreCase(scanOperation.method, httpMethod)
    );

    if (!filteredScanOperation) {
      return false;
    }

    return true;
  }

  static getTotalOperationsNumber(paths: ApiConformanceScanPathV221[]): number {
    return paths.reduce((counter, path) => counter + path.operations.length, 0);
  }

  /**
   * Count successful tests only if the corresponding `errorsOnly` parameter is not set to true
   */
  static getSumOfAvailableTestResults(stats: ApiConformanceScanPathStatsV221, isFullReport: boolean): number {
    if (isFullReport) {
      return stats.totalRequestsCount;
    }

    return (
      stats.codeIncorrectConformityFailureCount +
      stats.codeIncorrectConformitySuccessCount +
      stats.codeUnexpectedConformityFailureCount +
      stats.codeUnexpectedConformitySuccessCount +
      stats.codeExpectedConformityFailureCount
    );
  }

  static getOperationOwaspStats(issues: ApiConformanceScanIssueV221[]): number {
    let stats = 0;
    issues.forEach((issue: ApiConformanceScanIssueV221) => {
      if (
        issue.owaspIssuesFound
          ?.map((foundling) => foundling.id)
          .every((foundlingId) => foundlingId !== SupportedOwaspTopTenIssueList.None)
      ) {
        stats++;
      }
    });
    return stats;
  }

  static getCodeIncorrectConformityFailureCount(issues: ApiConformanceScanIssueV221[]): number {
    let stats = 0;
    issues.forEach((issue: ApiConformanceScanIssueV221) => {
      if (!issue.isContractConforming && issue.injectionStatus === ApiConformanceScanResponseAnalysisKey.Successful) {
        stats++;
      }
    });
    return stats;
  }

  static getCodeIncorrectConformitySuccessCount(issues: ApiConformanceScanIssueV221[]): number {
    let stats = 0;
    issues.forEach((issue: ApiConformanceScanIssueV221) => {
      if (issue.isContractConforming && issue.injectionStatus === ApiConformanceScanResponseAnalysisKey.Successful) {
        stats++;
      }
    });
    return stats;
  }

  static getCodeUnexpectedConformityFailureCount(issues: ApiConformanceScanIssueV221[]): number {
    let stats = 0;
    issues.forEach((issue: ApiConformanceScanIssueV221) => {
      if (!issue.isContractConforming && issue.injectionStatus === ApiConformanceScanResponseAnalysisKey.Unexpected) {
        stats++;
      }
    });
    return stats;
  }

  static getCodeUnexpectedConformitySuccessCount(issues: ApiConformanceScanIssueV221[]): number {
    let stats = 0;
    issues.forEach((issue: ApiConformanceScanIssueV221) => {
      if (issue.isContractConforming && issue.injectionStatus === ApiConformanceScanResponseAnalysisKey.Unexpected) {
        stats++;
      }
    });
    return stats;
  }

  static getCodeExpectedConformityFailureCount(issues: ApiConformanceScanIssueV221[]): number {
    let stats = 0;
    issues.forEach((issue: ApiConformanceScanIssueV221) => {
      if (!issue.isContractConforming && issue.injectionStatus === ApiConformanceScanResponseAnalysisKey.Expected) {
        stats++;
      }
    });
    return stats;
  }

  static getCodeExpectedConformitySuccessCount(
    issues: ApiConformanceScanIssueV221[],
    isHappyPathSuccess: boolean
  ): number {
    let stats = Number(isHappyPathSuccess); // if HP is successful, we get one more unlisted test, which is coerced from the boolean
    issues.forEach((issue: ApiConformanceScanIssueV221) => {
      if (issue.isContractConforming && issue.injectionStatus === ApiConformanceScanResponseAnalysisKey.Expected) {
        stats++;
      }
    });
    return stats;
  }

  static checkIsPathMatched(scanPath: string, path: string, isStrictPathMatch: boolean): boolean {
    const trimmedScanPath = this.trimEnd(scanPath, '/');
    const trimmedPath = this.trimEnd(path, '/');

    const isEmptyPath = StringUtils.isNullOrEmpty(trimmedPath);

    let isPathMatched: boolean;

    if (isEmptyPath && !isStrictPathMatch) {
      isPathMatched = true;
    } else if (!isStrictPathMatch) {
      isPathMatched = StringUtils.startsWithIgnoreCase(trimmedScanPath, trimmedPath);
    } else {
      isPathMatched = StringUtils.equalsIgnoreCase(trimmedScanPath, trimmedPath);
    }

    return isPathMatched;
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
        happyPathResponseHttp = happyPathResponse.responseHttp; // StringUtils.parseBase64ToUTF(happyPathResponse.responseHttp);
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

  static getSkippedOperationPathStatsV221(
    pathStats: ApiConformanceScanPathStatsV221,
    operation: ApiConformanceScanOperationV221
  ): ApiConformanceScanPathStatsV221 {
    return new ApiConformanceScanPathStatsV221({
      ...pathStats,
      skippedOperationsCount: pathStats.skippedOperationsCount + 1,
      happyPathFailed:
        operation.happyPathStats?.isFailed === true ? pathStats.happyPathFailed + 1 : pathStats.happyPathFailed,
      happyPathSuccess:
        operation.happyPathStats?.isFailed === false ? pathStats.happyPathSuccess + 1 : pathStats.happyPathSuccess
    });
  }

  static getUpdatedPathStatsV221(
    pathStats: ApiConformanceScanPathStatsV221,
    operation: ApiConformanceScanOperationV221,
    issues: ApiConformanceScanIssueV221[]
  ): ApiConformanceScanPathStatsV221 {
    return new ApiConformanceScanPathStatsV221({
      ...pathStats,
      totalRequestsCount: pathStats.totalRequestsCount + operation.totalRequestCount,
      failedRequestsCount: pathStats.failedRequestsCount + issues.length,
      totalExpected: pathStats.totalExpected + operation.totalExpected,
      totalUnexpected: pathStats.totalUnexpected + operation.totalUnexpected,
      totalFailure: pathStats.totalFailure + operation.totalFailure,
      happyPathFailed:
        operation.happyPathStats?.isFailed === true ? pathStats.happyPathFailed + 1 : pathStats.happyPathFailed,
      happyPathSuccess:
        operation.happyPathStats?.isFailed === false ? pathStats.happyPathSuccess + 1 : pathStats.happyPathSuccess,
      owaspIssuesCount: pathStats.owaspIssuesCount + ScanReportV221MappingService.getOperationOwaspStats(issues),
      codeIncorrectConformityFailureCount:
        pathStats.codeIncorrectConformityFailureCount +
        ScanReportV221MappingService.getCodeIncorrectConformityFailureCount(issues),
      codeIncorrectConformitySuccessCount:
        pathStats.codeIncorrectConformitySuccessCount +
        ScanReportV221MappingService.getCodeIncorrectConformitySuccessCount(issues),
      codeUnexpectedConformityFailureCount:
        pathStats.codeUnexpectedConformityFailureCount +
        ScanReportV221MappingService.getCodeUnexpectedConformityFailureCount(issues),
      codeUnexpectedConformitySuccessCount:
        pathStats.codeUnexpectedConformitySuccessCount +
        ScanReportV221MappingService.getCodeUnexpectedConformitySuccessCount(issues),
      codeExpectedConformityFailureCount:
        pathStats.codeExpectedConformityFailureCount +
        ScanReportV221MappingService.getCodeExpectedConformityFailureCount(issues),
      codeExpectedConformitySuccessCount:
        pathStats.codeExpectedConformitySuccessCount +
        ScanReportV221MappingService.getCodeExpectedConformitySuccessCount(
          issues,
          operation.happyPathDetails?.happyPathKey === ApiConformanceScanHappyPathKey.HappyPathSuccess
        )
    });
  }

  static getUpdatedGlobalPathStatsV221(
    stats: ApiConformanceScanPathStatsV221,
    pathStats: ApiConformanceScanPathStatsV221
  ): ApiConformanceScanPathStatsV221 {
    return new ApiConformanceScanPathStatsV221({
      totalRequestsCount: stats.totalRequestsCount + pathStats.totalRequestsCount,
      failedRequestsCount: stats.failedRequestsCount + pathStats.failedRequestsCount,
      skippedOperationsCount: stats.skippedOperationsCount + pathStats.skippedOperationsCount,
      totalExpected: stats.totalExpected + pathStats.totalExpected,
      totalUnexpected: stats.totalUnexpected + pathStats.totalUnexpected,
      totalFailure: stats.totalFailure + pathStats.totalFailure,
      happyPathFailed: stats.happyPathFailed + pathStats.happyPathFailed,
      happyPathSuccess: stats.happyPathSuccess + pathStats.happyPathSuccess,
      owaspIssuesCount: stats.owaspIssuesCount + pathStats.owaspIssuesCount,
      codeIncorrectConformityFailureCount:
        stats.codeIncorrectConformityFailureCount + pathStats.codeIncorrectConformityFailureCount,
      codeIncorrectConformitySuccessCount:
        stats.codeIncorrectConformitySuccessCount + pathStats.codeIncorrectConformitySuccessCount,
      codeUnexpectedConformityFailureCount:
        stats.codeUnexpectedConformityFailureCount + pathStats.codeUnexpectedConformityFailureCount,
      codeUnexpectedConformitySuccessCount:
        stats.codeUnexpectedConformitySuccessCount + pathStats.codeUnexpectedConformitySuccessCount,
      codeExpectedConformityFailureCount:
        stats.codeExpectedConformityFailureCount + pathStats.codeExpectedConformityFailureCount,
      codeExpectedConformitySuccessCount:
        stats.codeExpectedConformitySuccessCount + pathStats.codeExpectedConformitySuccessCount
    });
  }

  static async prepareMetadataItem(key: string, value: any): Promise<MetadataItem> {
    return new Promise<MetadataItem>(async (resolve, reject) => {
      let dbItem: MetadataItem = { key: '', value: null };

      switch (key) {
        case MetadataKey.TaskId:
          dbItem = {
            key: MetadataKey.TaskId,
            value
          };
          break;
        case MetadataKey.ScanVersion:
          const defaultMinEngineVersion = new SemanticVersion(
            apiConformanceScanApiConfig.conformanceScanReport.engineVersions.operationKeyDashSeparatorMinimumVersion
          );
          try {
            dbItem = {
              key: reportMetadataMap[MetadataKey.ScanVersion],
              value: value
                ? // replace "x" with "0" for parsing older/misspelled scan versions, like 1.13.x
                  SemanticVersionUtils.parse(value.replace('x', '0'))
                : defaultMinEngineVersion
            };
          } catch (error) {
            reject('failed-to-parse-scan-report-engine-version ,' + error);
          }
          break;
        case MetadataKey.ScanReportVersion:
          const defaultMinReportVersion: SemanticVersion = new SemanticVersion(
            apiConformanceScanApiConfig.conformanceScanReport.reportVersions.operationKeyDashSeparatorMinimumVersion
          );
          try {
            dbItem = {
              key: reportMetadataMap[MetadataKey.ScanReportVersion],
              value: value ? SemanticVersionUtils.parse(value) : defaultMinReportVersion
            };
          } catch (error) {
            reject('failed-to-parse-scan-report-schema-version,' + error);
          }
          break;
        case MetadataKey.ErrorsOnly:
          dbItem = {
            key: reportMetadataMap[MetadataKey.ErrorsOnly],
            value: !value
          };
          break;
        case MetadataKey.State:
          dbItem = {
            key: reportMetadataMap[MetadataKey.State],
            value
          };
          break;
        case MetadataKey.ExitCode:
          dbItem = {
            key: reportMetadataMap[MetadataKey.ExitCode],
            value
          };
          break;
        case MetadataKey.TotalRequest:
          dbItem = {
            key: reportMetadataMap[MetadataKey.TotalRequest],
            value
          };
          break;
        case MetadataKey.Issues:
          dbItem = {
            key: reportMetadataMap[MetadataKey.Issues],
            value
          };
          break;
        case MetadataKey.StartDate:
          dbItem = {
            key: reportMetadataMap[MetadataKey.StartDate],
            value: value ? new Date(value) : null
          };
          break;
      }

      resolve(dbItem);
    });
  }

  static getValueObject(key: string, index: number, value: any) {
    return {
      pointer: key,
      index,
      value
    };
  }
}
