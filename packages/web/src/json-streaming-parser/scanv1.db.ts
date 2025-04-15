// @ts-nocheck

import Dexie from "dexie";

import { StringUtils } from "./utils/string-utils";
import { ScanReportV221MappingService } from "./scan-report-v2-2-1-mapping.service";
import {
  ScanReportIntegralFilter,
  SortOrder,
  ParserFieldSortOrder,
  ApiConformanceScanIssueV221,
  ApiConformanceScanPathV221,
  PaginationResponse,
  MetadataItem,
  ApiConformanceScanIssuesFilterType,
  ApiConformanceScanOperationV221,
  FilterStats,
  ApiConformanceScanPathStatsV221,
} from "./models";

export class Scanv1Db {
  private readonly dbName: string = "";
  private db: any;

  constructor(dbName: string = "defaultDb") {
    this.dbName = dbName;
    this.db = new Dexie(this.dbName);
    this.db.version(1).stores({
      // , means primary key is neither inbound nor auto-incremented
      metadata:
        ",taskId, engineVersion, reportVersion, isFullReport, state, exitCode, requestsCount, issuesCount, date",
      index:
        ",jsonPointers, contentTypes, injectionKeys, injectionDescriptions, responseKeys, responseDescriptions",
      paths: "&path", // & means unique
      operations: "[path+method]", // + means compound primary key
      issues: "id, [path+method]",
    });
  }

  async init(): Promise<void> {
    try {
      await this.openDb();
      await this.clearDb();
    } catch (e: any) {
      throw new Error(`Failed to initialize db: ${e}`);
    }
  }

  async openDb(): Promise<void> {
    try {
      await this.db.open();
    } catch (e: any) {
      throw new Error(`Failed to initialize db: ${e}`);
    }
  }

  close(): void {
    // disableAutoOpen: false - allows us to open db instantly after closing
    this.db.close({ disableAutoOpen: false });
  }

  async clearDb(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.db.metadata.clear();
        await this.db.index.clear();
        await this.db.paths.clear();
        await this.db.operations.clear();
        await this.db.issues.clear();
        resolve();
      } catch (e: any) {
        reject(e);
      }
    });
  }

  async addMetadataItem(item: MetadataItem): Promise<void> {
    return await this.db.metadata.add(item.value, [item.key]);
  }

  async updateMetadataItem(item: MetadataItem): Promise<void> {
    return await this.db.metadata.put(item.value, [item.key]);
  }

  async getMetadataItem(key: string): Promise<any> {
    return await this.db.metadata.get([key]);
  }

  async addIndexArray(key: string, value: any): Promise<void> {
    return await this.db.index.add(value, [key]);
  }

  async updateIndexArray(key: string, value: any): Promise<void> {
    return await this.db.index.put(value, [key]);
  }

  async getIndexArray(key: string): Promise<any> {
    return await this.db.index.get([key]);
  }

  async addIssue(issue: ApiConformanceScanIssueV221): Promise<any> {
    return await this.db.issues.add({ ...issue });
  }

  async addOperation(operation: ApiConformanceScanOperationV221): Promise<any> {
    return await this.db.operations.add({ ...operation });
  }

  async getIssues(
    page: number,
    perPage: number,
    sortOrder: ParserFieldSortOrder,
    searchFilter: string = "",
    scanIssuesFilter: ScanReportIntegralFilter = new ScanReportIntegralFilter()
  ): Promise<PaginationResponse> {
    return new Promise<PaginationResponse>(async (resolve, reject) => {
      const offset: number = perPage * page - perPage;
      let issues: ApiConformanceScanIssueV221[] = [];
      let filteredItems: number = 0;
      let totalItems: number = 0;

      if (sortOrder?.order === SortOrder.Desc) {
        try {
          issues = await this.db.issues
            .orderBy(sortOrder?.fieldName || "path")
            .reverse()
            .filter((issue: ApiConformanceScanIssueV221): boolean =>
              ScanReportV221MappingService.filterIssues(issue, searchFilter, scanIssuesFilter)
            )
            .offset(offset)
            .limit(perPage)
            .toArray();
        } catch (e: any) {
          reject(e);
        }
      } else {
        try {
          issues = await this.db.issues
            .orderBy(sortOrder?.fieldName || "path")
            .filter((issue: ApiConformanceScanIssueV221): boolean =>
              ScanReportV221MappingService.filterIssues(issue, searchFilter, scanIssuesFilter)
            )
            .offset(offset)
            .limit(perPage)
            .toArray();
        } catch (e: any) {
          reject(e);
        }
      }

      try {
        totalItems = await this.db.issues.count();
        filteredItems = 0;

        await this.db.issues
          .orderBy(sortOrder?.fieldName || "path")
          .filter((issue: ApiConformanceScanIssueV221): boolean =>
            ScanReportV221MappingService.filterIssues(issue, searchFilter, scanIssuesFilter)
          )
          .each(() => {
            filteredItems++;
          });
      } catch (e: any) {
        reject(e);
      }

      let totalPages: number = totalItems / perPage;

      if (totalPages - Math.floor(totalPages) > 0) {
        totalPages = Math.floor(totalPages) + 1;
      }

      resolve({
        list: issues,
        totalPages,
        totalItems,
        filteredItems,
      } as PaginationResponse);
    });
  }

  async getSkippedIssues(
    page: number,
    perPage: number,
    searchFilter: string = "",
    scanIssuesFilter: ScanReportIntegralFilter = new ScanReportIntegralFilter()
  ): Promise<PaginationResponse> {
    return new Promise<PaginationResponse>(async (resolve, reject) => {
      const offset: number = perPage * page - perPage;
      let filteredItems: number = 0;
      let totalItems: number = 0;

      try {
        const operations = await this.db.operations
          .filter((operation: ApiConformanceScanOperationV221): boolean => {
            // here we take only skipped (failed) operations
            if (!operation.isSkipped) {
              return false;
            }

            return ScanReportV221MappingService.filterApiConformanceScanOperations(
              operation,
              searchFilter,
              scanIssuesFilter
            );
          })
          .offset(offset)
          .limit(perPage)
          .toArray();

        // Here we calculate some stats
        await this.db.operations
          .filter((operation: ApiConformanceScanOperationV221): boolean => {
            // here we take only skipped (failed) operations
            if (!operation.isSkipped) {
              return false;
            }

            // we use it here as we need only skipped (failed) operations
            totalItems++;

            const isMatched: boolean =
              ScanReportV221MappingService.filterApiConformanceScanOperations(
                operation,
                searchFilter,
                scanIssuesFilter
              );

            return isMatched;
          })
          .each(() => {
            filteredItems++;
          });

        let totalPages: number = totalItems / perPage;

        if (totalPages - Math.floor(totalPages) > 0) {
          totalPages = Math.floor(totalPages) + 1;
        }

        resolve({
          list: operations,
          totalPages,
          totalItems,
          filteredItems,
        } as PaginationResponse);
      } catch (e: any) {
        reject(e);
      }
    });
  }

  async getFilterStats(
    scanIssuesFilter: ScanReportIntegralFilter = new ScanReportIntegralFilter(),
    isFullReport: boolean = false
  ): Promise<FilterStats> {
    return new Promise<FilterStats>(async (resolve, reject) => {
      let filteredScanPaths: ApiConformanceScanPathV221[] = [];

      try {
        filteredScanPaths = await this.db.paths
          .filter((path: ApiConformanceScanPathV221): boolean =>
            ScanReportV221MappingService.filterApiConformanceScanPaths(
              path,
              scanIssuesFilter ? scanIssuesFilter.path : null,
              scanIssuesFilter ? scanIssuesFilter.httpMethod : null,
              scanIssuesFilter
                ? scanIssuesFilter.hierarchicalLevelFilterType !==
                    ApiConformanceScanIssuesFilterType.SubPaths
                : false
            )
          )
          .toArray();
      } catch (e: any) {
        reject(e);
      }

      // Unfortunately, we cannot perform this check inside dexie filter as
      // the filtering function must return boolean, but here we need
      // to return an object
      if (scanIssuesFilter?.httpMethod) {
        filteredScanPaths = filteredScanPaths.map((item: ApiConformanceScanPathV221) => {
          const filteredScanOperation = item.operations.find(
            (scanOperation: ApiConformanceScanOperationV221) =>
              StringUtils.equalsIgnoreCase(scanOperation.method, scanIssuesFilter?.httpMethod)
          );

          return new ApiConformanceScanPathV221({
            path: item.path,
            operations: [filteredScanOperation],
          });
        });
      }

      let filteredPathsStats: ApiConformanceScanPathStatsV221 =
        new ApiConformanceScanPathStatsV221();

      for (const path of filteredScanPaths) {
        let pathStats: ApiConformanceScanPathStatsV221 = new ApiConformanceScanPathStatsV221();

        for (const operation of path.operations) {
          if (operation.isSkipped) {
            pathStats = ScanReportV221MappingService.getSkippedOperationPathStatsV221(
              pathStats,
              operation
            );
          } else {
            try {
              const issues: ApiConformanceScanIssueV221[] = await this.db.issues
                .where({ path: operation.path, method: operation.method })
                .toArray();
              pathStats = ScanReportV221MappingService.getUpdatedPathStatsV221(
                pathStats,
                operation,
                issues
              );
            } catch (e: any) {
              reject(e);
            }
          }
        }

        filteredPathsStats = ScanReportV221MappingService.getUpdatedGlobalPathStatsV221(
          filteredPathsStats,
          pathStats
        );
      }

      const totalTestedCount: number = ScanReportV221MappingService.getSumOfAvailableTestResults(
        filteredPathsStats,
        isFullReport
      );
      const operationsTestedCount: number =
        ScanReportV221MappingService.getTotalOperationsNumber(filteredScanPaths);

      resolve({
        filteredPathsStats,
        totalTestedCount,
        operationsTestedCount,
      } as FilterStats);
    });
  }

  async getIssue(id: string): Promise<any> {
    return await this.db.issues.where("id").equals(id).toArray();
  }

  async addPath(item: ApiConformanceScanPathV221): Promise<void> {
    return await this.db.paths.add({ ...item });
  }

  async getPaths(): Promise<ApiConformanceScanPathV221[]> {
    return this.db.paths.toArray();
  }
}
