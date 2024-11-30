import { Event, EventEmitter, TextDocument, Memento } from "vscode";
import { DataFormat, FullDataDictionary } from "@xliic/common/data-dictionary";
import { NamingConvention, DefaultCollectionNamingPattern, TagRegex } from "@xliic/common/platform";
import { Configuration } from "../../configuration";

import {
  collectionUpdate,
  createApi,
  createCollection,
  deleteApi,
  deleteCollection,
  getApiNamingConvention,
  getCollectionNamingConvention,
  getDataDictionaries,
  getDataDictionaryFormats,
  listApis,
  listCollections,
  readApi,
  readAuditReport,
  readCollection,
  readCollectionUsers,
  updateApi,
  createDefaultScanConfig,
  readScanConfig,
  listScanConfigs,
  createScanConfig,
  listScanReports,
  readScanReport,
  readScanReportNew,
  readTechnicalCollection,
  createTechnicalCollection,
  searchCollections,
  createScanConfigNew,
  testConnection,
  readAuditCompliance,
  readAuditReportSqgTodo,
  getTags,
  getCategories,
} from "../api";
import {
  Api,
  ApiAuditReport,
  ApiFilter,
  CollectionData,
  CollectionFilter,
  Logger,
  PlatformConnection,
  UserData,
  Tag,
} from "../types";
import { TagData, TagDataEntry, TagEntry, TAGS_DATA_KEY } from "@xliic/common/tags";

export interface CollectionsView {
  collections: CollectionData[];
  hasMore: boolean;
}

export interface ApisView {
  apis: Api[];
  hasMore: boolean;
}

export interface DataDictionaryFormat {
  id: string;
  name: string;
  description: string;
  format: DataFormat;
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

export type PlatformConnectionEvent = {
  credentials: boolean;
  connected: boolean;
};

export class PlatformStore {
  private apiLastAssessment = new Map<string, Date>();
  private connection: PlatformConnection | undefined = undefined;
  readonly limits = new Limits();
  readonly filters = new Filters();
  readonly readonlyApis = new Set();
  private formats?: DataDictionaryFormat[];
  private _onConnectionDidChange = new EventEmitter<PlatformConnectionEvent>();
  private connected = false;

  constructor(private configuration: Configuration, private logger: Logger) {}

  get onConnectionDidChange(): Event<PlatformConnectionEvent> {
    return this._onConnectionDidChange.event;
  }

  async setCredentials(credentials?: PlatformConnection) {
    this.connection = credentials;
    this.readonlyApis.clear();
    await this.refresh();
    this._onConnectionDidChange.fire({
      credentials: this.hasCredentials(),
      connected: this.isConnected(),
    });
  }

  hasCredentials(): boolean {
    return (
      this.connection !== undefined && !!this.connection.platformUrl && !!this.connection.apiToken
    );
  }

  isConnected(): boolean {
    return this.connected;
  }

  async testConnection(credentials: PlatformConnection) {
    return testConnection(credentials, this.logger);
  }

  getConnection(): PlatformConnection {
    if (this.connection === undefined) {
      throw new Error(`Platform connection has not been configured`);
    }
    return this.connection;
  }

  async getCollectionNamingConvention(): Promise<NamingConvention> {
    return getCollectionNamingConvention(this.getConnection(), this.logger);
  }

  async getApiNamingConvention(): Promise<NamingConvention> {
    return getApiNamingConvention(this.getConnection(), this.logger);
  }

  async getCollections(
    filter: CollectionFilter | undefined,
    limit: number
  ): Promise<CollectionsView> {
    const response = await listCollections(filter, this.getConnection(), this.logger);

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

  async searchCollections(name: string) {
    return searchCollections(name, this.getConnection(), this.logger);
  }

  async getAllCollections(): Promise<CollectionData[]> {
    const response = await listCollections(
      { name: undefined, owner: "ALL" },
      this.getConnection(),
      this.logger
    );
    return response.list;
  }

  async createCollection(name: string): Promise<CollectionData> {
    const collection = await createCollection(name, this.getConnection(), this.logger);
    return collection;
  }

  async collectionRename(collectionId: string, name: string) {
    await collectionUpdate(collectionId, name, this.getConnection(), this.logger);
  }

  async apiRename(apiId: string, name: string): Promise<void> {
    await updateApi(apiId, { name }, this.getConnection(), this.logger);
  }

  async createApi(collectionId: string, name: string, json: string): Promise<Api> {
    const tagIds: string[] = [];
    const mandatoryTags = getMandatoryTags(this.configuration);
    if (mandatoryTags.length > 0) {
      const platformTags = await getTags(this.getConnection(), this.logger);
      tagIds.push(...getMandatoryTagsIds(mandatoryTags, platformTags));
    }

    const api = await createApi(
      collectionId,
      name,
      tagIds,
      Buffer.from(json),
      this.getConnection(),
      this.logger
    );
    return api;
  }

  async createTempApi(
    json: string,
    tagDataEntry?: TagDataEntry
  ): Promise<{ apiId: string; collectionId: string }> {
    const collectionId = await this.findOrCreateTempCollection();

    const tagIds: string[] = [];
    const mandatoryTags = getMandatoryTags(this.configuration);
    if (mandatoryTags.length > 0) {
      const platformTags = await getTags(this.getConnection(), this.logger);
      tagIds.push(...getMandatoryTagsIds(mandatoryTags, platformTags));
    }
    if (tagDataEntry) {
      if (Array.isArray(tagDataEntry)) {
        const platformTags = await getTags(this.getConnection(), this.logger);
        tagIds.push(...getActiveTagsIds(tagDataEntry, platformTags));
      } else {
        tagIds.push(
          ...(await this.getTagsIdsFromApi(tagDataEntry.collectionId, tagDataEntry.apiId))
        );
      }
    }

    // if the api naming convention is configured, use its example as the api name
    // this way we don't have to come up with a name that matches its pattern
    const convention = await this.getApiNamingConvention();
    const apiName = convention.pattern !== "" ? convention.example : `tmp-${Date.now()}`;

    const api = await createApi(
      collectionId,
      apiName,
      Array.from(new Set<string>(tagIds).values()),
      Buffer.from(json),
      this.getConnection(),
      this.logger
    );
    return { apiId: api.desc.id, collectionId };
  }

  async clearTempApi(tmp: { apiId: string; collectionId: string }): Promise<void> {
    // delete the api
    await deleteApi(tmp.apiId, this.getConnection(), this.logger);
    // check if any of the old apis have to be deleted
    const current = new Date().getTime();
    const response = await listApis(tmp.collectionId, this.getConnection(), this.logger);
    const convention = await this.getApiNamingConvention();
    for (const api of response.list) {
      const name = api.desc.name;
      if (name.startsWith("tmp-")) {
        const timestamp = Number(name.split("-")[1]);
        if (current - timestamp > 600000) {
          await deleteApi(api.desc.id, this.getConnection(), this.logger);
        }
      } else if (convention.pattern !== "" && name === convention.example) {
        // if the api naming convention is configured, we don't have timestamps in the name
        await deleteApi(api.desc.id, this.getConnection(), this.logger);
      }
    }
  }

  async updateApi(apiId: string, content: Buffer): Promise<void> {
    const api = await readApi(apiId, this.getConnection(), this.logger, false);
    const last = api?.assessment?.last ? new Date(api.assessment.last) : new Date(0);
    this.apiLastAssessment.set(apiId, last);
    await updateApi(apiId, { specfile: content }, this.getConnection(), this.logger);
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await deleteCollection(collectionId, this.getConnection(), this.logger);
  }

  async deleteApi(apiId: string): Promise<void> {
    await deleteApi(apiId, this.getConnection(), this.logger);
  }

  async getApis(
    collectionId: string,
    filter: ApiFilter | undefined,
    limit: number
  ): Promise<ApisView> {
    const response = await listApis(collectionId, this.getConnection(), this.logger);

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
    const api = await readApi(apiId, this.getConnection(), this.logger, true);
    return api;
  }

  async getCollection(collectionId: string): Promise<CollectionData> {
    const collection = await readCollection(collectionId, this.getConnection(), this.logger);
    return collection;
  }

  async getCollectionUsers(collectionId: string): Promise<UserData[]> {
    const collection = await readCollectionUsers(collectionId, this.getConnection(), this.logger);
    return collection;
  }

  async getAuditReport(apiId: string): Promise<ApiAuditReport> {
    const ASSESSMENT_MAX_WAIT = 60000;
    const ASSESSMENT_RETRY = 1000;

    const start = Date.now();
    let now = Date.now();
    const last = this.apiLastAssessment.get(apiId) ?? new Date(0);

    while (now - start < ASSESSMENT_MAX_WAIT) {
      const api = await readApi(apiId, this.getConnection(), this.logger, false);
      const current = new Date(api.assessment.last);
      const ready = api.assessment.isProcessed && current.getTime() > last.getTime();
      if (ready) {
        const report = await readAuditReport(apiId, this.getConnection(), this.logger);
        return report;
      }
      await delay(ASSESSMENT_RETRY);
      now = Date.now();
    }
    throw new Error(`Timed out while waiting for the assessment report for API ID: ${apiId}`);
  }

  async getDataDictionaries(): Promise<FullDataDictionary[]> {
    const dictionaries = await getDataDictionaries(this.getConnection(), this.logger);
    dictionaries.push({
      id: "standard",
      name: "standard",
      description: "Default standard formats",
    });
    const result = [];
    for (const dictionary of dictionaries) {
      const formats = await getDataDictionaryFormats(
        dictionary.id,
        this.getConnection(),
        this.logger
      );
      result.push({
        id: dictionary.id,
        name: dictionary.name,
        description: dictionary.description,
        formats,
      });
    }

    return result;
  }

  async getDataDictionaryFormats(): Promise<DataDictionaryFormat[]> {
    if (!this.formats) {
      const dictionaries = await getDataDictionaries(this.getConnection(), this.logger);
      dictionaries.push({
        id: "standard",
        name: "standard",
        description: "Default standard formats",
      });
      const result: DataDictionaryFormat[] = [];
      for (const dictionary of dictionaries) {
        const formats = await getDataDictionaryFormats(
          dictionary.id,
          this.getConnection(),
          this.logger
        );
        for (const format of Object.values<DataFormat>(formats)) {
          // entries from a standard dictionary do not have a o: prefix
          if (dictionary.id === "standard") {
            result.push({
              id: `o:${format.name}`,
              name: format.name,
              description: format.description,
              format: format,
            });
          } else {
            result.push({
              id: `o:${dictionary.name}:${format.name}`,
              name: `o:${dictionary.name}:${format.name}`,
              description: format.description,
              format: format,
            });
          }
        }
      }
      this.formats = result;
    }
    return this.formats;
  }

  async getTags(): Promise<Tag[]> {
    const categories = await getCategories(this.getConnection(), this.logger);
    const tags = await getTags(this.getConnection(), this.logger);
    for (const tag of tags) {
      tag.onlyAdminCanTag = categories.some(
        (category) => category.id === tag.categoryId && category.onlyAdminCanTag
      );
    }
    return tags;
  }

  async getTagsIdsFromApi(collectionId: string, apiId: string): Promise<string[]> {
    const resp = await listApis(collectionId, this.getConnection(), this.logger);
    const myApis = resp.list.filter((api) => api.desc.id === apiId);
    if (myApis.length === 0) {
      throw new Error(`The api "${apiId}" is not found. Please change the file api link.`);
    }
    const tags = myApis[0]?.tags;
    const tagIds: string[] = [];
    if (tags && tags.length > 0) {
      const allTags = await this.getTags();
      const adminTagIds = new Set(
        allTags.filter((tag) => tag.onlyAdminCanTag).map((tag) => tag.tagId)
      );
      tags.forEach((tag) => {
        if (!adminTagIds.has(tag.tagId)) {
          tagIds.push(tag.tagId);
        }
      });
    }
    return tagIds;
  }

  async getTagsForDocument(document: TextDocument, memento: Memento): Promise<string[]> {
    const mandatoryTags = getMandatoryTags(this.configuration);
    const tagDataEntry = getTagDataEntry(memento, document.uri.fsPath);
    if (tagDataEntry) {
      if (!Array.isArray(tagDataEntry)) {
        if (this.isConnected()) {
          const platformApiTags = await this.getTagsFromApi(
            tagDataEntry.collectionId,
            tagDataEntry.apiId
          );
          return Array.from(new Set([...mandatoryTags, ...platformApiTags]));
        } else {
          return [];
        }
      } else {
        const tags = tagDataEntry.map((tag) => `${tag.categoryName}:${tag.tagName}`);
        return Array.from(new Set([...mandatoryTags, ...tags]));
      }
    }
    return mandatoryTags;
  }

  async getTagsFromApi(collectionId: string, apiId: string): Promise<string[]> {
    const resp = await listApis(collectionId, this.getConnection(), this.logger);
    const myApis = resp.list.filter((api) => api.desc.id === apiId);
    if (myApis.length === 0) {
      throw new Error(`The api "${apiId}" is not found. Please change the file api link.`);
    }
    const apiTags = myApis[0]?.tags;
    const tags: string[] = [];
    if (apiTags && apiTags.length > 0) {
      const allTags = await this.getTags();
      const adminTagIds = new Set(
        allTags.filter((tag) => tag.onlyAdminCanTag).map((tag) => tag.tagId)
      );
      apiTags.forEach((tag) => {
        if (!adminTagIds.has(tag.tagId)) {
          tags.push(`${tag.categoryName}:${tag.tagName}`);
        }
      });
    }
    return tags;
  }

  async refresh(): Promise<void> {
    this.formats = undefined;
    if (this.hasCredentials()) {
      const { success } = await testConnection(this.getConnection(), this.logger);
      this.connected = success;
    } else {
      this.connected = false;
    }
  }

  async createDefaultScanConfig(apiId: string): Promise<any> {
    const configId = await createDefaultScanConfig(apiId, this.getConnection(), this.logger);
    return configId;
  }

  async readScanConfig(configId: string): Promise<any> {
    const config = await readScanConfig(configId, this.getConnection(), this.logger);
    return config;
  }

  async createScanConfig(apiId: string, name: string, config: unknown) {
    return createScanConfig(apiId, name, config, this.getConnection(), this.logger);
  }

  async createScanConfigNew(apiId: string, name: string, config: string) {
    return createScanConfigNew(apiId, name, config, this.getConnection(), this.logger);
  }

  async getScanConfigs(apiId: string): Promise<any> {
    const MAX_WAIT = 30000;
    const RETRY = 1000;
    const start = Date.now();
    const deadline = start + MAX_WAIT;
    while (Date.now() < deadline) {
      const configs = await listScanConfigs(apiId, this.getConnection(), this.logger);
      if (configs.length > 0) {
        return configs;
      }
      await delay(RETRY);
    }
    throw new Error(`Timed out while waiting for the scan config for API ID: ${apiId}`);
  }

  async listScanReports(apiId: string): Promise<any> {
    return listScanReports(apiId, this.getConnection(), this.logger);
  }

  async readScanReport(reportId: string): Promise<any> {
    return readScanReport(reportId, this.getConnection(), this.logger);
  }

  async readScanReportNew(reportId: string): Promise<any> {
    return readScanReportNew(reportId, this.getConnection(), this.logger);
  }

  async readTechnicalCollection(technicalName: string): Promise<any> {
    return readTechnicalCollection(technicalName, this.getConnection(), this.logger);
  }

  async createTechnicalCollection(technicalName: string, name: string): Promise<any> {
    return createTechnicalCollection(technicalName, name, this.getConnection(), this.logger);
  }

  async readAuditCompliance(taskId: string) {
    return readAuditCompliance(taskId, this.getConnection(), this.logger);
  }

  async readAuditReportSqgTodo(taskId: string) {
    return readAuditReportSqgTodo(taskId, this.getConnection(), this.logger);
  }

  async findOrCreateTempCollection(): Promise<string> {
    const namingConvention = await this.getCollectionNamingConvention();
    const collectionName = this.configuration.get<string>("platformTemporaryCollectionName");

    if (namingConvention.pattern !== "" && !collectionName.match(namingConvention.pattern)) {
      throw new Error(
        `The temporary collection name does not match the expected pattern defined in your organization. Please change the temporary collection name in your settings.`
      );
    }

    if (!collectionName.match(DefaultCollectionNamingPattern)) {
      throw new Error(
        `The temporary collection name does not match the expected pattern. Please change the temporary collection name in your settings.`
      );
    }

    const collections = await this.searchCollections(collectionName);
    // FIXME make sure that collection is owned by the user, for now take first accessible collection
    const writable = collections.list.filter(
      (cl) => cl.read && cl.write && cl.writeApis && cl.deleteApis
    );
    if (writable.length > 0) {
      return writable[0].id;
    } else {
      const collection = await this.createCollection(collectionName);
      return collection.desc.id;
    }
  }
}

export function getMandatoryTags(configuration: Configuration): string[] {
  const tags: string[] = [];

  const platformMandatoryTags = configuration.get<string>("platformMandatoryTags");
  if (platformMandatoryTags !== "") {
    if (platformMandatoryTags.match(TagRegex) !== null) {
      for (const tag of platformMandatoryTags.split(/[\s,]+/)) {
        if (tag !== "") {
          tags.push(tag);
        }
      }
    } else {
      throw new Error(
        `The mandatory tags "${platformMandatoryTags}" do not match the expected pattern. Please change the mandatory tags in your settings.`
      );
    }
  }

  return tags;
}

function getMandatoryTagsIds(tags: string[], platformTags: Tag[]): string[] {
  const tagIds: string[] = [];
  for (const tag of tags) {
    const found = platformTags.filter(
      (platformTag) => tag === `${platformTag.categoryName}:${platformTag.tagName}`
    );
    if (found.length > 0) {
      tagIds.push(found[0].tagId);
    } else {
      throw new Error(
        `The mandatory tag "${tag}" is not found. Please change the mandatory tags in your settings.`
      );
    }
  }
  return tagIds;
}

function getActiveTagsIds(tagEntries: TagEntry[], platformTags: Tag[]): string[] {
  const deadTags = [];
  const activeTagIds = new Set<string>(platformTags.map((tag) => tag.tagId));
  for (const tagEntry of tagEntries) {
    if (!activeTagIds.has(tagEntry.tagId)) {
      deadTags.push(`${tagEntry.categoryName}: ${tagEntry.tagName}`);
    }
  }
  if (deadTags.length > 0) {
    throw new Error(
      `The following tags are not found: ${deadTags.join(", ")}. Please change the file tags.`
    );
  }
  return tagEntries.map((tagEntry) => tagEntry.tagId);
}

export function getTagDataEntry(
  memento: Memento | undefined,
  filePath: string
): TagDataEntry | undefined {
  if (memento) {
    const tagData = memento.get(TAGS_DATA_KEY, {}) as TagData;
    return tagData[filePath];
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
