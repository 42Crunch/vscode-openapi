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
  readScanReport,
  updateApi,
} from "../api";
import {
  Api,
  ApiFilter,
  CollectionData,
  CollectionFilter,
  PlatformContext,
  UserData,
} from "../types";

export interface CollectionsView {
  collections: CollectionData[];
  hasMore: boolean;
}

export interface ApisView {
  apis: Api[];
  hasMore: boolean;
}

const COLLECTION_PAGE_SIZE = 100;
const APIS_PAGE_SIZE = 100;

export class Limits {
  private collections: number;
  private apis: Map<string, number>;
  private favorite: Map<string, number>;

  constructor() {
    this.collections = COLLECTION_PAGE_SIZE;
    this.apis = new Map();
    this.favorite = new Map();
  }

  getCollections() {
    return this.collections;
  }

  increaseCollections() {
    this.collections = this.collections + COLLECTION_PAGE_SIZE;
  }

  getApis(collectionId: string) {
    return this.apis.get(collectionId) ?? APIS_PAGE_SIZE;
  }

  increaseApis(collectionId: string) {
    this.apis.set(collectionId, (this.apis.get(collectionId) ?? APIS_PAGE_SIZE) + APIS_PAGE_SIZE);
  }

  getFavorite(collectionId: string) {
    return this.favorite.get(collectionId) ?? APIS_PAGE_SIZE;
  }

  increaseFavorite(collectionId: string) {
    this.favorite.set(
      collectionId,
      (this.favorite.get(collectionId) ?? APIS_PAGE_SIZE) + APIS_PAGE_SIZE
    );
  }

  reset() {
    this.collections = COLLECTION_PAGE_SIZE;
    this.apis = new Map();
    this.favorite = new Map();
  }
}

export class Filters {
  collection: CollectionFilter | undefined = undefined;
  readonly api: Map<string, ApiFilter> = new Map();
  readonly favorite: Map<string, ApiFilter> = new Map();
}

export class PlatformStore {
  private apiLastAssessment = new Map<string, Date>();
  readonly limits = new Limits();
  readonly filters = new Filters();

  constructor(private context: PlatformContext) {}

  async getCollections(
    filter: CollectionFilter | undefined,
    limit: number
  ): Promise<CollectionsView> {
    const response = await listCollections(filter, this.context.connection, this.context.logger);

    const filtered = response.list.filter((collection) => {
      if (filter) {
        return filter.name
          ? collection.desc.name.toLowerCase().includes(filter.name.toLowerCase())
          : true;
      }
      return true;
    });

    const hasMore = filtered.length > limit;

    return {
      hasMore,
      collections: filtered.slice(0, limit),
    };
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

  async getApis(
    collectionId: string,
    filter: ApiFilter | undefined,
    limit: number
  ): Promise<ApisView> {
    const response = await listApis(collectionId, this.context.connection, this.context.logger);

    const filtered = response.list.filter((api) => {
      if (filter) {
        return filter.name ? api.desc.name.toLowerCase().includes(filter.name.toLowerCase()) : true;
      }
      return true;
    });

    const hasMore = filtered.length > limit;

    return {
      hasMore,
      apis: filtered.slice(0, limit),
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

  async getScanReport(apiId: string): Promise<any> {
    return readScanReport(apiId, this.context.connection, this.context.logger);
  }

  refresh(): void {}
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
