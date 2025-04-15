export enum ApiConformanceScanExitCode {
  Ok = 0,
  InvalidApiDefinition = 1,
  InvalidScanConfiguration = 2,
  CannotReachApi = 3,
  OASFileTooComplex = 4,
  TooManyIssues = 5,
  TooManyTimeoutsOrConnectionClosed = 6,
  MaximumMemoryReached = 7,
  MaximumSizeReached = 8,
  MaximumScanTimeReached = 9
}
