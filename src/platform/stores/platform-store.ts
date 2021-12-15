import {
  collectionUpdate,
  createApi,
  createCollection,
  deleteApi,
  deleteCollection,
  listApis,
  listCollections,
  readApi,
  readAuditReport,
  readCollection,
  readCollectionUsers,
  updateApi,
} from "../api";
import { Api, CollectionData, CollectionFilter, PlatformContext, UserData } from "../types";

export interface CollectionsView {
  collections: CollectionData[];
  hasMore: boolean;
}

export interface ApisView {
  apis: Api[];
  hasMore: boolean;
}

const PAGE_SIZE = 100;

export class PlatformStore {
  private apiLimits = new Map<string, number>();
  private apiLastAssessment = new Map<string, Date>();
  private collectionLimit = PAGE_SIZE;
  private filter: CollectionFilter | undefined = undefined;

  constructor(private context: PlatformContext) {}

  async getFilteredCollections(): Promise<CollectionsView> {
    const response = await listCollections(
      this.filter,
      this.context.connection,
      this.context.logger
    );

    const filtered = response.list.filter((collection) => {
      if (this.filter) {
        return this.filter.name
          ? collection.desc.name.toLowerCase().includes(this.filter.name.toLowerCase())
          : true;
      }
      return true;
    });

    const hasMore = filtered.length > this.collectionLimit;

    return {
      hasMore,
      collections: filtered.slice(0, this.collectionLimit),
    };
  }

  setCollectionsFilter(filter: CollectionFilter): void {
    this.filter = filter;
  }

  getCollectionsFilter(): CollectionFilter | undefined {
    return this.filter;
  }

  increaseCollectionsLimit() {
    this.collectionLimit = this.collectionLimit + PAGE_SIZE;
  }

  async getAllCollections(): Promise<CollectionData[]> {
    const response = await listCollections(
      { name: undefined, owner: "ALL" },
      this.context.connection,
      this.context.logger
    );
    return response.list;
  }

  async createCollection(name: string): Promise<CollectionData> {
    const collection = await createCollection(name, this.context.connection, this.context.logger);
    return collection;
  }

  async collectionRename(collectionId: string, name: string) {
    await collectionUpdate(collectionId, name, this.context.connection, this.context.logger);
  }

  async apiRename(apiId: string, name: string): Promise<void> {
    await updateApi(apiId, { name }, this.context.connection, this.context.logger);
  }

  async createApi(collectionId: string, name: string, json: string): Promise<Api> {
    const api = await createApi(
      collectionId,
      name,
      Buffer.from(json),
      this.context.connection,
      this.context.logger
    );
    return api;
  }

  async updateApi(apiId: string, content: Buffer): Promise<void> {
    const api = await readApi(apiId, this.context.connection, this.context.logger, false);
    const last = api?.assessment?.last ? new Date(api.assessment.last) : new Date(0);
    this.apiLastAssessment.set(apiId, last);
    await updateApi(apiId, { specfile: content }, this.context.connection, this.context.logger);
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await deleteCollection(collectionId, this.context.connection, this.context.logger);
  }

  async deleteApi(apiId: string): Promise<void> {
    await deleteApi(apiId, this.context.connection, this.context.logger);
  }

  increaseApiLimit(apiId: string) {
    const limit = this.apiLimits.get(apiId) ?? PAGE_SIZE;
    this.apiLimits.set(apiId, limit + PAGE_SIZE);
  }

  async getApis(collectionId: string): Promise<ApisView> {
    const response = await listApis(collectionId, this.context.connection, this.context.logger);
    const limit = this.apiLimits.get(collectionId) ?? PAGE_SIZE;

    const hasMore = response.list.length > limit;

    return {
      hasMore,
      apis: response.list.slice(0, limit),
    };
  }

  async getApi(apiId: string): Promise<Api> {
    const api = await readApi(apiId, this.context.connection, this.context.logger, true);

    return api;
  }

  async getCollection(collectionId: string): Promise<CollectionData> {
    const collection = await readCollection(
      collectionId,
      this.context.connection,
      this.context.logger
    );
    return collection;
  }

  async getCollectionUsers(collectionId: string): Promise<UserData[]> {
    const collection = await readCollectionUsers(
      collectionId,
      this.context.connection,
      this.context.logger
    );
    return collection;
  }

  async getAuditReport(apiId: string): Promise<any> {
    const ASSESSMENT_MAX_WAIT = 60000;
    const ASSESSMENT_RETRY = 1000;

    const start = Date.now();
    let now = Date.now();
    const last = this.apiLastAssessment.get(apiId) ?? new Date(0);

    while (now - start < ASSESSMENT_MAX_WAIT) {
      const api = await readApi(apiId, this.context.connection, this.context.logger, false);
      const current = new Date(api.assessment.last);
      const ready = api.assessment.isProcessed && current.getTime() > last.getTime();
      if (ready) {
        const report = await readAuditReport(apiId, this.context.connection, this.context.logger);
        return report;
      }
      await delay(ASSESSMENT_RETRY);
      now = Date.now();
    }
    throw new Error(`Timed out while waiting for the assessment report for API ID: ${apiId}`);
  }

  refresh(): void {}
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
