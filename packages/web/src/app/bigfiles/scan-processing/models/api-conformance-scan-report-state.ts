export enum ApiConformanceScanReportState {
  // Here we combine v1 and v2 states. Otherwise, it is impossible to maintain them properly
  Finished = 'finished',
  Done = 'done',
  Blocked = 'blocked',
  Timeout = 'maxScanTimeReached',
  Invalid = 'oasInvalid',
  ConfigurationInvalid = 'configurationInvalid',
  ApiUnreachable = 'apiUnreachable',
  OasComplex = 'oasComplex',
  IssuesLimitReached = 'issuesLimitReached',
  ApiTimeoutLimitReached = 'apiTimeoutLimitReached',
  MaxMemoryReached = 'maxMemoryReached',
  ReportSizeExceeded = 'reportSizeExceeded',

  // V2 state
  Success = 'success',
  OasInvalid = 'oasInvalid',
  OasTooComplex = 'oasTooComplex',
  MaxScanTimeReached = 'maxScanTimeReached'
}
