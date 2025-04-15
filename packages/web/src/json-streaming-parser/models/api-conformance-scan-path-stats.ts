export class ApiConformanceScanPathStatsV221 {
  readonly totalRequestsCount: number;
  readonly failedRequestsCount: number;
  readonly skippedOperationsCount: number;
  readonly totalExpected: number;
  readonly totalUnexpected: number;
  readonly totalFailure: number;
  readonly happyPathFailed: number;
  readonly happyPathSuccess: number;
  readonly owaspIssuesCount: number;
  readonly codeIncorrectConformityFailureCount: number;
  readonly codeIncorrectConformitySuccessCount: number;
  readonly codeUnexpectedConformityFailureCount: number;
  readonly codeUnexpectedConformitySuccessCount: number;
  readonly codeExpectedConformityFailureCount: number;
  readonly codeExpectedConformitySuccessCount: number;

  constructor({
    totalRequestsCount,
    failedRequestsCount,
    skippedOperationsCount,
    totalExpected,
    totalUnexpected,
    totalFailure,
    happyPathFailed,
    happyPathSuccess,
    owaspIssuesCount,
    codeIncorrectConformityFailureCount,
    codeIncorrectConformitySuccessCount,
    codeUnexpectedConformityFailureCount,
    codeUnexpectedConformitySuccessCount,
    codeExpectedConformityFailureCount,
    codeExpectedConformitySuccessCount
  }: Partial<ApiConformanceScanPathStatsV221> = {}) {
    this.totalRequestsCount = totalRequestsCount || 0;
    this.failedRequestsCount = failedRequestsCount || 0;
    this.skippedOperationsCount = skippedOperationsCount || 0;
    this.totalExpected = totalExpected || 0;
    this.totalUnexpected = totalUnexpected || 0;
    this.totalFailure = totalFailure || 0;
    this.happyPathFailed = happyPathFailed || 0;
    this.happyPathSuccess = happyPathSuccess || 0;
    this.owaspIssuesCount = owaspIssuesCount || 0;
    this.codeIncorrectConformityFailureCount = codeIncorrectConformityFailureCount || 0;
    this.codeIncorrectConformitySuccessCount = codeIncorrectConformitySuccessCount || 0;
    this.codeUnexpectedConformityFailureCount = codeUnexpectedConformityFailureCount || 0;
    this.codeUnexpectedConformitySuccessCount = codeUnexpectedConformitySuccessCount || 0;
    this.codeExpectedConformityFailureCount = codeExpectedConformityFailureCount || 0;
    this.codeExpectedConformitySuccessCount = codeExpectedConformitySuccessCount || 0;
  }
}
