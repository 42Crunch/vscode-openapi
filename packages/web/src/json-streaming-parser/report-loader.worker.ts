// @ts-nocheck

import { DBService } from "./scan-processing/services/db.service";
import {
  apiConformanceScanApiConfig,
  ApiConformanceScanHappyPathDetailsV221,
  ApiConformanceScanHappyPathKey,
  ApiConformanceScanHappyPathStatsV221,
  ApiConformanceScanIssueV221,
  ApiConformanceScanOperationSkipReasonKeyV221,
  ApiConformanceScanOperationV221,
  ApiConformanceScanOwaspIssues,
  ApiConformanceScanPathV221,
  ApiConformanceScanReportApiResponseAnalysisResponse,
  ApiConformanceScanReportIndexResponse,
  ApiConformanceScanReportScanLogResponse,
  ApiConformanceScanResponseAnalysisKey,
  ApiConformanceScanResponseAnalysisV221,
  ArrayKey,
  arrayKeys,
  HttpMethod,
  IntegralScanReportIssueStatus,
  MetadataItem,
  MetadataKey,
  metadataKeys,
  methods,
  OperartionKey,
  operationKeyMap,
  operationKeys,
  OwaspIssueDetail,
  owaspIssueDetails,
  pathsKey,
  reportMetadataMap,
  SemanticVersion,
  Severity,
  StatusCode,
} from "./scan-processing/models";
import { SemanticVersionUtils } from "./scan-processing/utils/semantic-version.utils";
import { StringUtils } from "./scan-processing/utils/string-utils";
import { ScanReportV221MappingService } from "./scan-processing/services/scan-report-v2-2-1-mapping.service";
import { Parser } from "./scan-processing/clarinet/clarinet";

let parser: Parser;
let dbService: DBService;

let stack: any[] = [];
let currentKey: string = "";
let isArrayOpened: boolean = false;
let arrayBuf: { [key: string]: any[] } = {};
let keyValueBuf: { [key: string]: any } = {};
let isPathParsing: boolean = false;

// addEventListener("message", async ({ data: { reportId } }) => {
//   console.time("parsing");
//   await processReport(reportId);
// });

async function initDb(): Promise<void> {
  dbService = new DBService();

  return await dbService
    .init()
    .then(() =>
      console.log("%c Connected to the database", "text-transform: uppercase; color: green")
    )
    .catch((e: any) => {
      throwError(`Failed to connect to the database: ${e.message}`);
    });
}

// async function getReport(reportId: string): Promise<any> {
//   const url: URL = new URL(`http://localhost:4222/api/v1/scanReports/${reportId}/content`);
//   return fetch(url);
// }

export async function initProcessReport(): Promise<void> {
  await initDb();

  parser = new Parser({
    onValue,
    onKey,
    onOpenObject,
    onCloseObject,
    onOpenArray,
    onCloseArray,
    onEnd,
    onError,
    onReady,
  });
}

export async function processReport(done: boolean, value: string): Promise<void> {
  await parser.write(value as string);
  if (done) {
    await parser.close();
  }
}

async function onValue(value: any): Promise<void> {
  return new Promise(async (resolve) => {
    if (isPathParsing) {
      await onPathsValue(currentKey, value);
    } else {
      await onMetadataValue(currentKey, value);
    }

    resolve();
  });
}
async function onKey(key: string): Promise<void> {
  return new Promise(async (resolve) => {
    if (key === pathsKey) {
      isPathParsing = true;
      currentKey = "";
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
          stack.push(
            new ApiConformanceScanOperationV221({
              path: (stack[1] as ApiConformanceScanPathV221).path,
              method: key,
            })
          );
          currentKey = key;
        } else if (currentIndex === 2) {
          currentKey = key;
        } else {
          if (key) {
            if (currentKey) {
              stack.push(getValueObject(currentKey, -1, { [key]: null }));
            } else {
              if (stack[currentIndex].pointer) {
                if (isArrayOpened) {
                  const arrayLength = stack[currentIndex].value.length;
                  stack.push(getValueObject(currentKey, arrayLength, { [key]: null }));
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
              stack.push(getValueObject(currentKey, -1, {}));
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
async function onOpenObject(key: string): Promise<void> {
  return new Promise(async (resolve) => {
    if (isPathParsing) {
      const currentIndex: number = getCurrentIndex();

      if (currentIndex >= 1) {
        // It means we have a parent path object
        // So the current key is an operation
        if (currentIndex === 1) {
          stack.push(
            new ApiConformanceScanOperationV221({
              path: (stack[1] as ApiConformanceScanPathV221).path,
              method: key,
            })
          );
          currentKey = key;
        } else if (currentIndex === 2) {
          currentKey = key;
        } else {
          if (key) {
            if (currentKey) {
              stack.push(getValueObject(currentKey, -1, { [key]: null }));
            } else {
              if (stack[currentIndex].pointer) {
                if (isArrayOpened) {
                  const arrayLength = stack[currentIndex].value.length;
                  stack.push(getValueObject(currentKey, arrayLength, { [key]: null }));
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
              stack.push(getValueObject(currentKey, -1, {}));
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
async function onCloseObject(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (isPathParsing) {
      const currentIndex: number = getCurrentIndex();

      if (currentIndex > 1) {
        const parentKey = stack[currentIndex].pointer;
        const parentIndex = stack[currentIndex].index;

        if (currentIndex > 2) {
          if (parentKey) {
            if (currentIndex - 1 === 2) {
              stack[currentIndex - 1][parentKey] = stack[currentIndex].value;
            } else {
              stack[currentIndex - 1].value[parentKey] = stack[currentIndex].value;
            }
          } else if (parentIndex >= 0) {
            // console.log('%c 4 ', 'text-transform: uppercase; color: white; background-color: red');
            // console.log(
            //   '%c currentIndex ',
            //   'text-transform: uppercase; color: white; background-color: purple',
            //   currentIndex
            // );
            // console.log(
            //   '%c stack ',
            //   'text-transform: uppercase; color: white; color: #2274A5',
            //   JSON.parse(JSON.stringify(stack))
            // );
            stack[currentIndex - 1].value[parentIndex] = stack[currentIndex].value;
            isArrayOpened = true;
          }
        } else if (currentIndex === 2) {
          // console.log(
          //   '%c currentIndex ',
          //   'text-transform: uppercase; color: white; background-color: purple',
          //   currentIndex
          // );
          // console.log(
          //   '%c stack ',
          //   'text-transform: uppercase; color: white; background-color: #2274A5',
          //   JSON.parse(JSON.stringify(stack))
          // );
          if (!isArrayOpened) {
            (stack[currentIndex - 1] as ApiConformanceScanPathV221).operations.push(
              stack[currentIndex]
            );
          }
        }

        stack = stack.slice(0, currentIndex);
        currentKey = "";
        // console.log(
        //   '%c stack ===== ',
        //   'text-transform: uppercase; color: white; color: #2274A5',
        //   JSON.parse(JSON.stringify(stack))
        // );
      } else if (currentIndex === 1) {
        try {
          await dbService.addPath(stack[currentIndex]);
          stack = stack.slice(0, currentIndex);
          currentKey = "";
        } catch (err) {
          reject(err);
        }
      } else if (currentIndex === 0) {
        stack = [];
        isPathParsing = false;
        isArrayOpened = false;
      }

      const newIndex: number = getCurrentIndex();

      if (
        newIndex === 3 &&
        stack[newIndex].pointer === MetadataKey.Issues &&
        stack[newIndex].value.length > 0
      ) {
        const issue = stack[newIndex].value[0];
        try {
          const newIssue: ApiConformanceScanIssueV221 =
            await mapConformanceScanIssueResponsePromise(issue, stack[2].path, stack[2].method);
          await putIssueIntoDb(newIssue);
          stack[newIndex].value = stack[newIndex].value.slice(1);
        } catch (err) {
          reject(err);
        }
      }
    } else {
      currentKey = "";
    }
    resolve();
  });
}
async function onOpenArray(): Promise<void> {
  return new Promise(async (resolve) => {
    isArrayOpened = true;

    if (isPathParsing) {
      isArrayOpened = true;
      stack.push(getValueObject(currentKey, -1, []));
      currentKey = "";
    } else {
      if (arrayKeys.includes(currentKey)) {
        arrayBuf = { [currentKey]: [] };
      }
    }

    resolve();
  });
}
async function onCloseArray(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    isArrayOpened = false;

    if (isPathParsing) {
      isArrayOpened = false;
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
async function onEnd(): Promise<void> {
  return new Promise(async (resolve) => {
    console.log(
      "%c stack ",
      "text-transform: uppercase; color: white; background-color: green",
      stack
    );
    console.log("%c end parsing ", "text-transform: uppercase; color: white; color: red");
    console.timeEnd("parsing");
    returnReport(stack[0]);
    resolve();
  });
}
async function onError(e: Error): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await throwError(`JSON parser error: ${e.message}`);
    reject();
  });
}

function onReady(): void {
  console.log(
    "%c Parser is ready ",
    "text-transform: uppercase; color: white; background-color: blue"
  );
}

async function onPathsValue(key: string, value: any = null): Promise<void> {
  return new Promise(async (resolve) => {
    const currentIndex: number = getCurrentIndex();

    if (currentIndex === 2) {
      if (operationKeys.includes(key)) {
        const reportVersion = await dbService.getMetadataItem(
          reportMetadataMap[MetadataKey.ScanReportVersion]
        );

        switch (key) {
          case OperartionKey.Checked:
            stack[currentIndex] = {
              ...(stack[currentIndex] as ApiConformanceScanOperationV221),
              [operationKeyMap[key]]: !value,
            };
            break;
          case OperartionKey.TotalRequest:
          case OperartionKey.TotalExpected:
          case OperartionKey.TotalUnexpected:
          case OperartionKey.TotalFailure:
            stack[currentIndex] = {
              ...(stack[currentIndex] as ApiConformanceScanOperationV221),
              [operationKeyMap[key]]: value,
            };
            break;
          case OperartionKey.Reason:
            const operationSkipReasonKey =
              ScanReportV221MappingService.mapApiConformanceScanOperationKeyResponse(
                value || "",
                reportVersion
              ) as ApiConformanceScanOperationSkipReasonKeyV221;

            let happyPathDetailsForReason: ApiConformanceScanHappyPathDetailsV221 | null = null;

            if (
              operationSkipReasonKey ===
              ApiConformanceScanOperationSkipReasonKeyV221.HappyPathFailed
            ) {
              happyPathDetailsForReason =
                ScanReportV221MappingService.mapApiConformanceScanHappyPathDetailsResponse(
                  null,
                  reportVersion
                );
            }

            stack[currentIndex] = {
              ...(stack[currentIndex] as ApiConformanceScanOperationV221),
              [operationKeyMap[key]]: value,
              skipReason: operationSkipReasonKey,
              happyPathDetails: happyPathDetailsForReason,
            };

            break;
          case OperartionKey.SkipReasonDetails:
            (stack[currentIndex] as ApiConformanceScanOperationV221)[operationKeyMap[key]] = (
              value || []
            ).filter((item: string) => !StringUtils.isNullOrWhitespace(item));
            break;
          case OperartionKey.HappyPath:
            let happyPathStats: ApiConformanceScanHappyPathStatsV221 | null = null;

            if (value) {
              happyPathStats = {
                isFailed: !(value.key === ApiConformanceScanHappyPathKey.HappyPathSuccess),
              };
            }

            let happyPathDetails: ApiConformanceScanHappyPathDetailsV221 | null = null;

            if (
              (stack[currentIndex] as ApiConformanceScanOperationV221).skipReason ===
              ApiConformanceScanOperationSkipReasonKeyV221.HappyPathFailed
            ) {
              happyPathDetails = this.mapApiConformanceScanHappyPathDetailsResponse(
                value.happyPath || null,
                reportVersion
              );
            }

            stack[currentIndex] = {
              ...(stack[currentIndex] as ApiConformanceScanOperationV221),
              [operationKeyMap[key]]: value,
              happyPathStats,
              happyPathDetails,
            };

            break;
        }
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

      currentKey = "";
    }
    resolve();
  });
}

async function putDataIntoDb(key: string, data: any, type: string = "array"): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      if (type === "array") {
        let existingValue: any = await dbService.getIndexArray(key);

        if (existingValue !== undefined) {
          await dbService.updateIndexArray(key, data);
        } else {
          await dbService.addIndexArray(key, data);
        }
      }
      resolve();
    } catch (e: Error) {
      reject(e);
    }
  });
}

function getValueObject(key, index, value) {
  return {
    pointer: key,
    index,
    value,
  };
}

function getCurrentIndex() {
  return stack.length - 1;
}

async function mapConformanceScanIssueResponsePromise(
  response: ApiConformanceScanReportScanLogResponse,
  path: string,
  method: HttpMethod,
  index?: ApiConformanceScanReportIndexResponse
): Promise<ApiConformanceScanIssueV221> {
  return new Promise(async (resolve, reject) => {
    const injectionKeys: string[] = await dbService.getIndexArray(ArrayKey.InjectionKeys);
    const injectionDescriptions: string[] = await dbService.getIndexArray(
      ArrayKey.InjectionDescriptions
    );
    const responseKeys: string[] = await dbService.getIndexArray(ArrayKey.ResponseKeys);
    const responseDescriptions: string[] = await dbService.getIndexArray(
      ArrayKey.ResponseDescriptions
    );
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
      (hasIndex
        ? injectionKeys[response.injectionKey as number]
        : (response.injectionKey as string)) || "";

    const injectionDescriptionWithPlaceholders =
      (hasIndex
        ? injectionDescriptions[response.injectionDescription as number]
        : (response.injectionDescription as string)) || "";

    const injectionDescription: string = ScanReportV221MappingService.mapDescriptionResponse(
      injectionDescriptionWithPlaceholders,
      response.injectionDescriptionParams || []
    );

    const responseAnalysisList: ApiConformanceScanResponseAnalysisV221[] = (
      response.apiResponseAnalysis || []
    ).map((responseAnalysisItem: ApiConformanceScanReportApiResponseAnalysisResponse) => {
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
          : (responseDescriptionWithPlaceholdersValue as string)) || "";

      const responseDescription = ScanReportV221MappingService.mapDescriptionResponse(
        responseDescriptionWithPlaceholders,
        responseDescriptionParams
      );

      return { responseKey, responseDescription };
    });

    const requestContentType =
      (hasIndex
        ? contentTypes[response.requestContentType as number]
        : (response.requestContentType as string)) || "";

    const responseContentType =
      (hasIndex
        ? contentTypes[response.responseContentType as number]
        : (response.responseContentType as string)) || "";

    const jsonPointer =
      (hasIndex
        ? jsonPointers[response.jsonPointer as number]
        : (response.jsonPointer as string)) || "";

    let responseBody: string;
    if (!StringUtils.isNullOrEmpty(response.responseBody)) {
      try {
        responseBody = StringUtils.parseBase64ToUTF(response.responseBody);
      } catch (error) {
        responseBody = "";
        console.log(`Failed to parse API Conformance Scan issue body: ${responseBody}`, error);
      }
    } else {
      responseBody = "";
    }

    if (!responseBody && !!response.responseHttp) {
      responseBody = response.responseHttp.split(
        apiConformanceScanApiConfig.responseHeaderAndBodySeparator
      )[1];
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

    const injectionStatus = responseAnalysisList[0]
      ?.responseKey as ApiConformanceScanResponseAnalysisKey;

    const isContractConforming: boolean = responseAnalysisList.length < 2;

    const owaspMapping = response.owaspMapping;

    const owaspDetail = owaspMapping
      ? owaspIssueDetails.find((item: OwaspIssueDetail) => item.id === response.owaspMapping)
      : owaspIssueDetails.find(
          (item: OwaspIssueDetail) => item.id === ApiConformanceScanOwaspIssues.None
        );

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
      requestDate: response.requestDate ? new Date(response.requestDate) : "",
      requestContentType,
      requestBodyLength: response.requestBodyLength || 0,
      url: response.url || "",
      curl: response.curl || "",
      responseTime: response.responseTime || 0,
      responseHttpStatusCode: response.responseHttpStatusCode || StatusCode.Unknown,
      responseContentType,
      responseBodyLength: response.responseBodyLength || 0,
      responseBody,
      injectionStatus,
      isContractConforming,
      integralStatus,
      expected,
    });

    resolve(scanIssue);
  });
}

// -------------- METADATA ------------- //
async function onMetadataValue(key: string, value: any): Promise<void> {
  return new Promise(async (resolve) => {
    if (metadataKeys.includes(key)) {
      await patchMetadata(key, value);
      keyValueBuf = {};
      currentKey = "";
      resolve();
    } else if (arrayKeys.includes(key)) {
      if (isArrayOpened) {
        arrayBuf[key].push(value);
      }
      resolve();
    } else {
      currentKey = "";
      resolve();
    }
  });
}

async function patchMetadata(key: string, value: any): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const metadataItem: MetadataItem = await prepareMetadataItem(key, value);
      // const existingValue: any = await dbService.getMetadataItem(metadataItem.key);
      //
      // if (existingValue !== undefined) {
      //   await dbService.updateMetadataItem(metadataItem);
      // } else {
      await dbService.addMetadataItem(metadataItem);
      // }

      resolve();
    } catch (e: Error) {
      reject(e);
    }
  });
}

async function prepareMetadataItem(key: string, value: any): Promise<MetadataItem> {
  return new Promise(async (resolve, reject) => {
    let dbItem: MetadataItem;

    switch (key) {
      case MetadataKey.TaskId:
        dbItem = {
          key: MetadataKey.TaskId,
          value,
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
                SemanticVersionUtils.parse(value.replace("x", "0"))
              : defaultMinEngineVersion,
          };
        } catch (error) {
          reject("failed-to-parse-scan-report-engine-version ," + error);
        }
        break;
      case MetadataKey.ScanReportVersion:
        const defaultMinReportVersion: SemanticVersion = new SemanticVersion(
          apiConformanceScanApiConfig.conformanceScanReport.reportVersions.operationKeyDashSeparatorMinimumVersion
        );
        try {
          dbItem = {
            key: reportMetadataMap[MetadataKey.ScanReportVersion],
            value: value ? SemanticVersionUtils.parse(value) : defaultMinReportVersion,
          };
        } catch (error) {
          reject("failed-to-parse-scan-report-schema-version," + error);
        }
        break;
      case MetadataKey.ErrorsOnly:
        dbItem = {
          key: reportMetadataMap[MetadataKey.ErrorsOnly],
          value: !value,
        };
        break;
      case MetadataKey.State:
        dbItem = {
          key: reportMetadataMap[MetadataKey.State],
          value,
        };
        break;
      case MetadataKey.ExitCode:
        dbItem = {
          key: reportMetadataMap[MetadataKey.ExitCode],
          value,
        };
        break;
      case MetadataKey.TotalRequest:
        dbItem = {
          key: reportMetadataMap[MetadataKey.TotalRequest],
          value,
        };
        break;
      case MetadataKey.Issues:
        dbItem = {
          key: reportMetadataMap[MetadataKey.Issues],
          value,
        };
        break;
      case MetadataKey.StartDate:
        dbItem = {
          key: reportMetadataMap[MetadataKey.StartDate],
          value: value ? new Date(value) : null,
        };
        break;
    }

    resolve(dbItem);
  });
}

async function putIssueIntoDb(issue: ApiConformanceScanIssueV221): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // let existingIssue: any[] = await dbService.getIssue(issue.id);
      // console.log(
      //   '%c existingIssue |||||| ',
      //   'text-transform: uppercase; color: white; background-color: blue',
      //   existingIssue
      // );
      //
      // if (!existingIssue.length) {
      await dbService.addIssue(issue);
      // }

      resolve();
    } catch (e: Error) {
      reject(e);
    }
  });
}

// ------------------------------------ //

async function throwError(errorText: string): Promise<void> {
  return new Promise((reject) => {
    postMessage({ error: errorText });
    reject();
  });
}

function returnReport(report: any): void {
  postMessage({ data: report });
}
