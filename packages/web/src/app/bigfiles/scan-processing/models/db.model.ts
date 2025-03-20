import { HttpMethod } from './http-method';

export enum ArrayKey {
  JSONPointers = 'jsonPointers',
  ContentTypes = 'contentTypes',
  InjectionKeys = 'injectionKeys',
  InjectionDescriptions = 'injectionDescriptions',
  ResponseKeys = 'responseKeys',
  ResponseDescriptions = 'responseDescriptions'
}

export const pathsKey: string = 'paths';

export enum MetadataKey {
  TaskId = 'taskId',
  ScanVersion = 'scanVersion',
  ScanReportVersion = 'scanReportVersion',
  ErrorsOnly = 'errorsOnly',
  State = 'state',
  ExitCode = 'exitCode',
  TotalRequest = 'totalRequest',
  Issues = 'issues',
  StartDate = 'startDate'
}

// Report properties named differently from BE response
export const reportMetadataMap: { [key: string]: string } = {
  [MetadataKey.TaskId]: MetadataKey.TaskId,
  [MetadataKey.ScanVersion]: 'engineVersion',
  [MetadataKey.ScanReportVersion]: 'reportVersion',
  [MetadataKey.ErrorsOnly]: 'isFullReport',
  [MetadataKey.State]: MetadataKey.State,
  [MetadataKey.ExitCode]: MetadataKey.ExitCode,
  [MetadataKey.TotalRequest]: 'requestsCount',
  [MetadataKey.Issues]: 'issuesCount',
  [MetadataKey.StartDate]: 'date'
};

export const arrayKeys: string[] = Object.values(ArrayKey).map((item: string) => item);

export const metadataKeys: string[] = Object.values(MetadataKey).map((item: string) => item);

export interface MetadataItem {
  key: string;
  value: any;
}

export enum OperartionKey {
  Checked = 'checked',
  Reason = 'reason',
  CurlHappyPath = 'curlHappyPath',
  SkipReasonDetails = 'skipReasonDetails',
  HappyPath = 'happyPath',
  CurlBodySkipped = 'curlBodySkipped',
  TotalRequest = 'totalRequest',
  // Issues = 'issues',
  TotalExpected = 'totalExpected',
  TotalUnexpected = 'totalUnexpected',
  TotalFailure = 'totalFailure'
}

export const operationKeyMap: { [key: string]: string } = {
  [OperartionKey.Checked]: 'isSkipped',
  [OperartionKey.TotalRequest]: 'totalRequestCount',
  [OperartionKey.SkipReasonDetails]: OperartionKey.SkipReasonDetails,
  [OperartionKey.TotalExpected]: OperartionKey.TotalExpected,
  [OperartionKey.TotalUnexpected]: OperartionKey.TotalUnexpected,
  [OperartionKey.TotalFailure]: OperartionKey.TotalFailure,
  [OperartionKey.Reason]: OperartionKey.Reason
};

export const operationKeys: string[] = Object.values(OperartionKey).map((item: string) => item);

export const methods: string[] = Object.values(HttpMethod).map((item: string) => item.toLowerCase());
