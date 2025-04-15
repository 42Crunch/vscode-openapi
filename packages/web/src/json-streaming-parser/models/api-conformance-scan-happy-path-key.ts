export enum ApiConformanceScanHappyPathKey {
  HappyPathRequestGeneration = 'happy-path-request-generate',
  HappyPathRequestPrepare = 'happy-path-request-prepare',
  HappyPathRequestHTTP = 'happy-path-request-http',

  // Key + Curl
  HappyPathTimeout = 'happy-path-timeout',
  HappyPathDoRequest = 'happy-path-request-send',
  HappyPathResponseError = 'happy-path-response-error',

  // Include all fields
  HappyPathResponseInvalid = 'happy-path-response-invalid',
  HappyPathResponseNotSuccessfull = 'happy-path-response-not-successfull',
  HappyPathCleanup = 'happy-path-cleanup-error',
  HappyPathSuccess = 'happy-path-success'
}
