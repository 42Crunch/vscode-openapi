import { StringUtils } from './utils/string-utils';
import { ScanReportV221MappingService } from './scan-report-v2-2-1-mapping.service';
import { Scanv1Db } from './scanv1.db';
import {
  ArrayKey,
  arrayKeys,
  MetadataItem,
  MetadataKey,
  metadataKeys,
  OperartionKey,
  operationKeyMap,
  operationKeys,
  pathsKey,
  reportMetadataMap
} from './models/db.model';
import {
  ApiConformanceScanIssueV221,
  ApiConformanceScanPathV221,
  ApiConformanceScanHappyPathStatsV221,
  ApiConformanceScanHappyPathKey,
  ApiConformanceScanHappyPathDetailsV221,
  ApiConformanceScanOperationSkipReasonKeyV221,
  ApiConformanceScanOperationV221,
  ApiConformanceScanResponseAnalysisV221,
  HttpMethod,
  OwaspIssueDetail,
  IntegralScanReportIssueStatus,
  ApiConformanceScanResponseAnalysisKey,
  StatusCode,
  Severity,
  apiConformanceScanApiConfig,
  SemanticVersion,
  owaspIssueDetailsKdb,
  SupportedOwaspTopTenIssueList,
  ApiConformanceScanReportApiResponseAnalysisResponse,
  ApiConformanceScanReportIndexResponse,
  ApiConformanceScanReportScanLogResponse,
  ApiConformanceScanReportOperationResponse,
  ScanReportV300NextReason
} from './models';

let stack: any[] = [];
let currentKey: string = '';
let isArrayOpened: boolean = false;
let arrayBuf: { [key: string]: any[] } = {};
let keyValueBuf: { [key: string]: any } = {};
let isPathParsing: boolean = false;
let dbService: Scanv1Db;

export async function initDb(dbName: string): Promise<void> {
  dbService = new Scanv1Db(dbName);

  return await dbService
    .init()
    // eslint-disable-next-line no-console
    .then(() => console.log('%c Connected to the database', 'text-transform: uppercase; color: green'))
    .catch((e: any) => {
      throw new Error(`Failed to connect to the database: ${e.message}`);
    });
}

export async function processMetadata(metadata: { [key: string]: any }): Promise<void> {
  return new Promise<void>(async (resolve) => {
    const keys: string[] = Object.keys(metadata);

    for (const key of keys) {
      if (metadataKeys.includes(key)) {
        await patchMetadata(key, metadata[key]);
      }
    }

    resolve();
  });
}

export async function onValue(value: any): Promise<void> {
  return new Promise<void>(async (resolve) => {
    if (isPathParsing) {
      await onPathsValue(currentKey, value);
    } else {
      await onMetadataValue(currentKey, value);
    }

    resolve();
  });
}

export async function onKey(key: string): Promise<void> {
  return new Promise<void>(async (resolve) => {
    if (key === pathsKey) {
      isPathParsing = true;
      currentKey = '';
      keyValueBuf = {};
      arrayBuf = {};
      isArrayOpened = false;
      stack.push(pathsKey);
      resolve();
      return;
    }

    if (isPathParsing) {
      const currentIndex: number = getCurrentIndex();

      if (currentIndex >= 1) {
        if (currentIndex === 1) {
          currentKey = key;
          stack.push(
            new ApiConformanceScanOperationV221({
              path: (stack[1] as ApiConformanceScanPathV221).path,
              method: key as HttpMethod
            })
          );
        } else if (currentIndex === 2) {
          currentKey = key;
        } else {
          if (key) {
            if (currentKey) {
              stack.push(ScanReportV221MappingService.getValueObject(currentKey, -1, { [key]: null }));
            } else {
              if (stack[currentIndex].pointer) {
                if (isArrayOpened) {
                  const arrayLength = stack[currentIndex].value.length;
                  stack.push(ScanReportV221MappingService.getValueObject(currentKey, arrayLength, { [key]: null }));
                  isArrayOpened = false;
                } else {
                  stack[currentIndex].value[key] = null;
                }
              } else {
                if (isArrayOpened) {
                  stack[currentIndex].push({ [key]: null });
                  isArrayOpened = false;
                } else {
                  stack[currentIndex].value[key] = null;
                }
              }
            }
            currentKey = key;
          } else {
            if (currentKey) {
              stack.push(ScanReportV221MappingService.getValueObject(currentKey, -1, {}));
            }
          }
        }
      } else if (currentIndex === 0) {
        if (key) {
          currentKey = key;
          stack.push(new ApiConformanceScanPathV221({ path: key }));
        }
      }
    } else {
      if (metadataKeys.includes(key)) {
        currentKey = key;
        keyValueBuf = { [currentKey]: null };
      }

      if (arrayKeys.includes(key)) {
        currentKey = key;
      }
    }

    resolve();
  });
}

export async function onOpenObject(key: string): Promise<void> {
  return new Promise<void>(async (resolve) => {
    if (isPathParsing) {
      const currentIndex: number = getCurrentIndex();

      if (currentIndex === 0) {
        if (key) {
          currentKey = key;
          stack.push(new ApiConformanceScanPathV221({ path: key }));
        }
      } else if (currentIndex === 1) {
        currentKey = key;
        stack.push(
          new ApiConformanceScanOperationV221({
            path: (stack[1] as ApiConformanceScanPathV221).path,
            method: key as HttpMethod
          })
        );
      } else {
        if (key) {
          if (currentKey) {
            stack.push(ScanReportV221MappingService.getValueObject(currentKey, -1, { [key]: null }));
          } else {
            if (stack[currentIndex].pointer) {
              if (isArrayOpened) {
                const arrayLength = stack[currentIndex].value.length;
                stack.push(ScanReportV221MappingService.getValueObject(currentKey, arrayLength, { [key]: null }));
                isArrayOpened = false;
              } else {
                stack[currentIndex].value[currentKey] = null;
              }
            } else {
              if (isArrayOpened) {
                stack[currentIndex].push({ [key]: null });
                isArrayOpened = false;
              } else {
                stack[currentIndex].value[key] = null;
              }
            }
          }
          currentKey = key;
        } else {
          if (currentKey) {
            stack.push(ScanReportV221MappingService.getValueObject(currentKey, -1, {}));
          }
        }
      }
    } else {
      if (metadataKeys.includes(key)) {
        currentKey = key;
        keyValueBuf = { [currentKey]: null };
      }

      if (arrayKeys.includes(key)) {
        currentKey = key;
      }
    }

    resolve();
  });
}

export async function onCloseObject(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    if (isPathParsing) {
      const currentIndex: number = getCurrentIndex();

      if (currentIndex > 1) {
        const parentKey = stack[currentIndex].pointer;
        const parentIndex = stack[currentIndex].index;

        if (currentIndex > 2) {
          if (parentKey) {
            if (currentIndex - 1 === 2) {
              try {
                const operation: ApiConformanceScanOperationV221 = await mapConformanceScanOperationResponsePromise(
                  stack[currentIndex].value,
                  stack[currentIndex - 1].path,
                  stack[currentIndex - 1].method
                );
                stack[currentIndex - 1] = { ...operation };
                await putOperationIntoDb(operation);
                stack = stack.slice(0, currentIndex);
                currentKey = '';
              } catch (err) {
                reject(err);
              }
            } else {
              stack[currentIndex - 1].value[parentKey] = stack[currentIndex].value;
            }
          } else if (parentIndex >= 0) {
            stack[currentIndex - 1].value[parentIndex] = stack[currentIndex].value;
            isArrayOpened = true;
          }
        } else if (currentIndex === 2) {
          if (!isArrayOpened) {
            (stack[currentIndex - 1] as ApiConformanceScanPathV221).operations.push(stack[currentIndex]);
          }
        }

        stack = stack.slice(0, currentIndex);
        currentKey = '';
      } else if (currentIndex === 1) {
        try {
          await dbService.addPath(stack[currentIndex]);
          stack = stack.slice(0, currentIndex);
          currentKey = '';
        } catch (err) {
          reject(err);
        }
      } else if (currentIndex === 0) {
        stack = [];
        isPathParsing = false;
        isArrayOpened = false;
      }

      const newIndex: number = getCurrentIndex();

      if (newIndex === 4 && stack[newIndex].pointer === MetadataKey.Issues && stack[newIndex].value.length > 0) {
        const issue = stack[newIndex].value[0];
        try {
          const newIssue: ApiConformanceScanIssueV221 = await mapConformanceScanIssueResponsePromise(
            issue,
            stack[2].path,
            stack[2].method
          );
          await putIssueIntoDb(newIssue);
          stack[newIndex].value = stack[newIndex].value.slice(1);
        } catch (err) {
          reject(err);
        }
      }

      if (newIndex === 2) {
        if (!isArrayOpened) {
          (stack[newIndex - 1] as ApiConformanceScanPathV221).operations.push(stack[newIndex]);
          stack = stack.slice(0, newIndex);
          currentKey = '';
        }
      }
    } else {
      currentKey = '';
    }
    resolve();
  });
}

export async function onOpenArray(): Promise<void> {
  return new Promise<void>(async (resolve) => {
    isArrayOpened = true;

    if (isPathParsing) {
      isArrayOpened = true;
      stack.push(ScanReportV221MappingService.getValueObject(currentKey, -1, []));
      currentKey = '';
    } else {
      if (arrayKeys.includes(currentKey)) {
        arrayBuf = { [currentKey]: [] };
      }
    }

    resolve();
  });
}

export async function onCloseArray(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    isArrayOpened = false;

    if (isPathParsing) {
      await onCloseObject();
    } else {
      if (arrayKeys.includes(currentKey)) {
        try {
          await putDataIntoDb(currentKey, arrayBuf[currentKey]);
          arrayBuf = {};
        } catch (err) {
          reject(err);
        }
      }
    }

    resolve();
  });
}

export function onReady(): void {
  // USE IT IF YOU NEED
}

export function onParsingEnd(): void {
  dbService.close();
}
async function onPathsValue(key: string, value: any = null): Promise<void> {
  return new Promise<void>(async (resolve) => {
    const currentIndex: number = getCurrentIndex();

    if (currentIndex === 2) {
      if (operationKeys.includes(key)) {
        const reportVersion = await dbService.getMetadataItem(reportMetadataMap[MetadataKey.ScanReportVersion]);

        switch (key) {
          case OperartionKey.Checked:
            stack[currentIndex] = {
              ...(stack[currentIndex] as ApiConformanceScanOperationV221),
              [operationKeyMap[key]]: !value
            };
            break;
          case OperartionKey.TotalRequest:
          case OperartionKey.TotalExpected:
          case OperartionKey.TotalUnexpected:
          case OperartionKey.TotalFailure:
            stack[currentIndex] = {
              ...(stack[currentIndex] as ApiConformanceScanOperationV221),
              [operationKeyMap[key]]: value
            };
            break;
          case OperartionKey.Reason:
            const operationSkipReasonKey = ScanReportV221MappingService.mapApiConformanceScanOperationKeyResponse(
              value || '',
              reportVersion
            ) as ApiConformanceScanOperationSkipReasonKeyV221;

            let happyPathDetailsForReason: ApiConformanceScanHappyPathDetailsV221 | null = null;

            if (operationSkipReasonKey === ApiConformanceScanOperationSkipReasonKeyV221.HappyPathFailed) {
              happyPathDetailsForReason = ScanReportV221MappingService.mapApiConformanceScanHappyPathDetailsResponse(
                null,
                reportVersion
              );
            }

            stack[currentIndex] = {
              ...(stack[currentIndex] as ApiConformanceScanOperationV221),
              [operationKeyMap[key]]: value,
              skipReason: operationSkipReasonKey,
              happyPathDetails: happyPathDetailsForReason
            };

            break;
          case OperartionKey.SkipReasonDetails:
            stack[currentIndex][operationKeyMap[key]] = (value || []).filter(
              (item: string) => !StringUtils.isNullOrWhitespace(item)
            );
            break;
        }
      } else {
        if (stack[currentIndex].pointer || stack[currentIndex].index >= 0) {
          if (isArrayOpened) {
            stack[currentIndex].value.push(value);
          } else {
            stack[currentIndex].value[currentKey] = value;
          }
        } else {
          if (isArrayOpened) {
            stack[currentIndex][currentKey].push(value);
          } else {
            stack[currentIndex][currentKey] = value;
          }
        }

        currentKey = '';
      }
    } else {
      if (stack[currentIndex].pointer || stack[currentIndex].index >= 0) {
        if (isArrayOpened) {
          stack[currentIndex].value.push(value);
        } else {
          stack[currentIndex].value[currentKey] = value;
        }
      } else {
        if (isArrayOpened) {
          stack[currentIndex][currentKey].push(value);
        } else {
          stack[currentIndex][currentKey] = value;
        }
      }

      currentKey = '';
    }

    resolve();
  });
}

async function putDataIntoDb(key: string, data: any, type: string = 'array'): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (type === 'array') {
        const existingValue: any = await dbService.getIndexArray(key);

        if (existingValue !== undefined) {
          await dbService.updateIndexArray(key, data);
        } else {
          await dbService.addIndexArray(key, data);
        }
      }
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

function getCurrentIndex(): number {
  return stack.length - 1;
}

async function mapConformanceScanIssueResponsePromise(
  response: ApiConformanceScanReportScanLogResponse,
  path: string,
  issueMethod: HttpMethod,
  index?: ApiConformanceScanReportIndexResponse
): Promise<ApiConformanceScanIssueV221> {
  return new Promise<ApiConformanceScanIssueV221>(async (resolve, reject) => {
    const method = issueMethod.toUpperCase() as HttpMethod;
    const injectionKeys: string[] = await dbService.getIndexArray(ArrayKey.InjectionKeys);
    const injectionDescriptions: string[] = await dbService.getIndexArray(ArrayKey.InjectionDescriptions);
    const responseKeys: any[] = await dbService.getIndexArray(ArrayKey.ResponseKeys);
    const responseDescriptions: string[] = await dbService.getIndexArray(ArrayKey.ResponseDescriptions);
    const contentTypes: string[] = await dbService.getIndexArray(ArrayKey.ContentTypes);
    const jsonPointers: string[] = await dbService.getIndexArray(ArrayKey.JSONPointers);

    const hasIndex =
      !!index ||
      !!injectionKeys ||
      !!injectionDescriptions ||
      !!responseKeys ||
      !!responseDescriptions ||
      !!contentTypes ||
      !!jsonPointers;

    const injectionKey =
      (hasIndex ? injectionKeys[response.injectionKey as number] : (response.injectionKey as string)) || '';

    const injectionDescriptionWithPlaceholders =
      (hasIndex
        ? injectionDescriptions[response.injectionDescription as number]
        : (response.injectionDescription as string)) || '';

    const injectionDescription: string = ScanReportV221MappingService.mapDescriptionResponse(
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
          ? responseKeys[responseKeyValue as number]
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
            ? responseDescriptions[responseDescriptionWithPlaceholdersValue as number]
            : (responseDescriptionWithPlaceholdersValue as string)) || '';

        const responseDescription = ScanReportV221MappingService.mapDescriptionResponse(
          responseDescriptionWithPlaceholders,
          responseDescriptionParams
        );

        return { responseKey, responseDescription };
      }
    );

    const requestContentType =
      (hasIndex ? contentTypes[response.requestContentType as number] : (response.requestContentType as string)) || '';

    const responseContentType =
      (hasIndex ? contentTypes[response.responseContentType as number] : (response.responseContentType as string)) ||
      '';

    const jsonPointer =
      (hasIndex ? jsonPointers[response.jsonPointer as number] : (response.jsonPointer as string)) || '';

    let responseBody: string = response.responseBody || '';
    if (!StringUtils.isNullOrEmpty(response.responseBody)) {
      try {
        responseBody = StringUtils.parseBase64ToUTF(response.responseBody);
      } catch (error) {
        responseBody = '';
        // TODO PROBABLY WE NEED TO REJECT PROMISE HERE
        // eslint-disable-next-line no-console
        console.log(`Failed to parse API Conformance Scan issue body: ${responseBody}`, error);
      }
    } else {
      responseBody = '';
    }

    if (!responseBody && !!response.responseHttp) {
      responseBody = response.responseHttp.split(apiConformanceScanApiConfig.responseHeaderAndBodySeparator)[1];
    }
    /** Additional body extraction flow for the latest non-incremented iteration of the scan report engine (the body property is always equal to `null` in it but full `responseHttp` is added instead) */
    if (!StringUtils.isNullOrEmpty(response.responseHttp)) {
      try {
        const responseHttp = StringUtils.parseBase64ToUTF(response.responseHttp);
        if (!responseBody && !!responseHttp) {
          responseBody = responseHttp.split(apiConformanceScanApiConfig.responseHeaderAndBodySeparator)[1];
        }
      } catch (error) {
        // TODO PROBABLY WE NEED TO REJECT PROMISE HERE
        // eslint-disable-next-line no-console
        console.log(`Failed to parse API Conformance Scan issue HTTP content: ${response.responseHttp}`, error);
      }
    }

    const injectionStatus = responseAnalysisList[0]?.responseKey as ApiConformanceScanResponseAnalysisKey;

    const isContractConforming: boolean = responseAnalysisList.length < 2;

    const owaspDetails: OwaspIssueDetail[] =
      !response.owaspByVersionMapping || Object.values(response.owaspByVersionMapping).length === 0
        ? [
            response.owaspMapping
              ? owaspIssueDetailsKdb.find((item: OwaspIssueDetail) => item.id === response.owaspMapping)
              : owaspIssueDetailsKdb.find((item: OwaspIssueDetail) => item.id === SupportedOwaspTopTenIssueList.None)
          ]
        : Object.values(response.owaspByVersionMapping).map((owaspIssueId: number) =>
            owaspIssueId
              ? owaspIssueDetailsKdb.find((item: OwaspIssueDetail) => item.id === owaspIssueId)
              : owaspIssueDetailsKdb.find((item: OwaspIssueDetail) => item.id === SupportedOwaspTopTenIssueList.None)
          );

    const owaspMapping: SupportedOwaspTopTenIssueList = owaspDetails[0]?.id || SupportedOwaspTopTenIssueList.None;

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
      owaspIssuesFound: owaspDetails,
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

    resolve(scanIssue);
  });
}

async function mapConformanceScanOperationResponsePromise(
  response: ApiConformanceScanReportOperationResponse,
  path: string,
  operationMethod: string
): Promise<ApiConformanceScanOperationV221> {
  return new Promise<ApiConformanceScanOperationV221>(async (resolve, reject) => {
    const reportVersion: SemanticVersion = await dbService.getMetadataItem(
      reportMetadataMap[MetadataKey.ScanReportVersion]
    );

    const method = operationMethod.toUpperCase() as HttpMethod;
    const isSkipped = !response.checked;

    // soft casting - reasons list can be extended later
    const operationSkipReasonKey = ScanReportV221MappingService.mapApiConformanceScanOperationKeyResponse(
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
      happyPathDetails = ScanReportV221MappingService.mapApiConformanceScanHappyPathDetailsResponse(
        response?.happyPath || null,
        reportVersion
      );
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
      issues: [],
      happyPathStats,
      reason: response.reason as ScanReportV300NextReason
    });

    resolve(scanOperation);
  });
}

// -------------- METADATA ------------- //
async function onMetadataValue(key: string, value: any): Promise<void> {
  return new Promise<void>(async (resolve) => {
    if (metadataKeys.includes(key)) {
      await patchMetadata(key, value);
      keyValueBuf = {};
      currentKey = '';
      resolve();
    } else if (arrayKeys.includes(key)) {
      if (isArrayOpened) {
        arrayBuf[key].push(value);
      }
      resolve();
    } else {
      currentKey = '';
      resolve();
    }
  });
}

async function patchMetadata(key: string, value: any): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const metadataItem: MetadataItem = await ScanReportV221MappingService.prepareMetadataItem(key, value);
      await dbService.addMetadataItem(metadataItem);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

async function putIssueIntoDb(issue: ApiConformanceScanIssueV221): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      await dbService.addIssue(issue);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

async function putOperationIntoDb(operation: ApiConformanceScanOperationV221): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      await dbService.addOperation(operation);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}
