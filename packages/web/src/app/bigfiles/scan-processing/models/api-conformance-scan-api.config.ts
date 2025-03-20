export const apiConformanceScanApiConfig = {
  conformanceScanReport: {
    url: 'scanreport',
    mappings: {
      placeholder: '%s',
      logsSeparator: '\n'
    },
    params: {
      logs: 'log',
      reportType: 'medium'
    },
    reportVersions: {
      operationKeyDashSeparatorMinimumVersion: { major: 2, minor: 1, patch: 12 }
    },
    engineVersions: {
      operationKeyDashSeparatorMinimumVersion: { major: 1, minor: 1, patch: 0 }
    }
  },
  scanReportsUrl: 'scanReports',
  scanConfigurations: {
    url: 'scanConfigurations',
    defaultUrl: 'default',
    changeReference: 'changeReference',
    compatibility: 'compatibility'
  },
  exportUrl: 'export',
  responseHeaderAndBodySeparator: '\r\n\r\n'
};
