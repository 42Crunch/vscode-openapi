import Dexie from 'dexie';
import { ApiConformanceScanIssueV221, ApiConformanceScanPathV221, MetadataItem, PaginationResponse } from '../models';

export class DBService {
  private dbName: string = 'scanReportDb';
  private db: any;

  constructor() {
    this.db = new Dexie(this.dbName);
    this.db.version(1).stores({
      metadata:
        ',taskId, engineVersion, reportVersion, isFullReport, state, exitCode, requestsCount, issuesCount, date',
      index: ',jsonPointers, contentTypes, injectionKeys, injectionDescriptions, responseKeys, responseDescriptions',
      paths: 'path, *operations.method',
      issues: '&id, path, method'
    });
  }

  async init(): Promise<void> {
    try {
      await this.db.open();
      await this.db.metadata.clear();
      await this.db.index.clear();
      await this.db.paths.clear();
      await this.db.issues.clear();
    } catch (e: any) {
      throw new Error('Failed to initialize db', e);
    }
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

  addArray(tableName: string, data: any[]): Promise<any> {
    return this.db[tableName].put({ id: 1, list: [...data] });
  }

  getArray(tableName: string): Promise<any[]> {
    return this.db[tableName].get(1);
  }

  async addIssue(issue: ApiConformanceScanIssueV221): Promise<any> {
    return await this.db.issues.add({ ...issue });
  }

  async getIssues(page: number, perPage: number): Promise<PaginationResponse> {
    const offset: number = perPage * page - perPage;
    const issues = await this.db.issues.offset(offset).limit(perPage).toArray();
    const totalItems = await this.db.issues.count();
    let totalPages: number = totalItems / perPage;

    if (totalPages - Math.floor(totalPages) > 0) {
      totalPages = Math.floor(totalPages) + 1;
    }

    return {
      list: issues,
      totalPages,
      totalItems
    } as PaginationResponse;
  }

  async getIssue(id: string): Promise<any> {
    return await this.db.issues.where('id').equals(id).toArray();
  }

  async addPath(item: ApiConformanceScanPathV221): Promise<void> {
    return await this.db.paths.add({ ...item });
  }
}
