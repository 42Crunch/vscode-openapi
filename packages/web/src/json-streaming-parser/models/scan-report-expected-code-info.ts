export enum ScanReportV300NextExpectationSource {
  Default = 'default',
  CustomizationRule = 'customizationRule',
  Configuration = 'configuration'
}

export enum ScanReportExpectedCodeSource {
  Default = 'default',
  CustomizationRule = 'customizationRule',
  Custom = 'custom'
}

export interface ScanReportExpectedCodeInfo {
  httpStatusCodes: string[];
  source: ScanReportExpectedCodeSource;
}

export interface ScanReportExpectedCodeInfoNext {
  httpStatusCodes: string[];
  source: ScanReportV300NextExpectationSource;
}
