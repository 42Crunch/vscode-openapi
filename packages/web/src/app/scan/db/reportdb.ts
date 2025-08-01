import Dexie from "dexie";

import { HappyPathReport, RuntimeOperationReport, TestLogReport } from "@xliic/common/scan-report";

import { stores as schema } from "./schema";
import { getDexieStores } from "@xliic/streaming-parser";

export type Page<T> = {
  items: T[];
  pages: number;
  total: number;
  current: number;
};

export type HappyPathEntry = {
  operationId: string;
  operation: Pick<RuntimeOperationReport, "path" | "method" | "reason" | "fuzzed">;
  report: HappyPathReport;
};

export type TestEntry = {
  operationId?: string;
  operation?: Pick<RuntimeOperationReport, "path" | "method" | "reason" | "fuzzed">;
  path: string;
  method: string;
  test: TestLogReport;
};

export type Filter = {
  criticality?: number;
  testKey?: number;
  path?: number;
  method?: number;
  operationId?: number;
};

export class ReportDb {
  private db: any;
  private startedPromise?: Promise<void>;
  private successfullyStarted?: () => void;
  private failedToStart?: (error: unknown) => void;
  private happyPathIndex: any;
  private testIndex: any;

  async start(name: string) {
    this.startedPromise = new Promise((resolve, reject) => {
      this.successfullyStarted = resolve;
      this.failedToStart = reject;
    });

    try {
      try {
        await Dexie.delete(name);
      } catch (error) {
        // Ignore error if the database does not exist
      }

      const stores = getDexieStores(schema());
      this.db = new Dexie(name);
      this.db.version(1).stores({ __metadata: "id", ...stores });

      await this.db.open();

      await this.db.__metadata.clear();
      for (const storeName of Object.keys(stores)) {
        await this.db[storeName].clear();
      }

      await this.db.__metadata.put({ id: 0, created: new Date().toISOString() });

      this.successfullyStarted?.();
    } catch (error) {
      this.failedToStart?.(error);
    }
  }

  async stop() {
    if (this.db) {
      this.db.close({ disableAutoOpen: true });
    }
    this.happyPathIndex = undefined;
    this.testIndex = undefined;
    this.startedPromise = undefined;
    this.successfullyStarted = undefined;
    this.db = undefined;
  }

  started(): Promise<void> {
    return this.startedPromise!;
  }

  async save(storeName: string, items: unknown[]) {
    if (items.length > 0) {
      await this.db[storeName].bulkPut(items);
    }
  }

  async getStrings(storeName: string): Promise<{ value: number; label: string }[]> {
    return this.db[storeName].toArray().then((entries: any) => {
      return entries.map((entry: any) => ({
        value: entry.id,
        label: entry.value,
      }));
    });
  }

  async getHappyPaths(
    pageIndex: number,
    pageSize: number,
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined
  ): Promise<Page<HappyPathEntry>> {
    const index = await this.readHappyPathIndex(sort);

    const found: any = [];
    for (const item of index) {
      found.push(item);
    }

    const indexPage = paginate(found, pageIndex, pageSize);
    const pages = Math.ceil(found.length / pageSize);

    const items: HappyPathEntry[] = [];

    for (const index of indexPage) {
      const data = await this.db.happyPath.get(index.id);
      const operation = await this.db.operation.get(index.operationIdIndex);
      const operationId = await this.db.operationIdIndex.get(index.operationIdIndex);
      items.push({
        operationId: operationId!.value,
        operation: operation.value,
        report: data.value,
      });
    }

    return {
      items,
      pages,
      current: pageIndex,
      total: found.length,
    };
  }

  async getTests(
    pageIndex: number,
    pageSize: number,
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined,
    filter: Filter
  ): Promise<Page<TestEntry>> {
    const index = await this.readTestIndex(sort);

    const found: any = [];
    for (const item of index) {
      // Apply filtering
      let includeItem = true;

      if (filter.criticality !== undefined && item.criticality < filter.criticality) {
        includeItem = false;
      }

      if (filter.testKey !== undefined && item.testKeyIndex !== filter.testKey) {
        includeItem = false;
      }

      if (filter.path !== undefined && item.pathIndex !== filter.path) {
        includeItem = false;
      }

      if (filter.method !== undefined && item.methodIndex !== filter.method) {
        includeItem = false;
      }

      if (filter.operationId !== undefined && item.operationIdIndex !== filter.operationId) {
        includeItem = false;
      }

      if (includeItem) {
        found.push(item);
      }
    }

    const indexPage = paginate(found, pageIndex, pageSize);
    const pages = Math.ceil(found.length / pageSize);

    const items: TestEntry[] = [];

    for (const index of indexPage) {
      const data = await this.db.test.get(index.id);
      const operation =
        index.operationIdIndex !== undefined
          ? await this.db.operation.get(index.operationIdIndex)
          : undefined;
      const operationId =
        index.operationIdIndex !== undefined
          ? await this.db.operationIdIndex.get(index.operationIdIndex)
          : undefined;

      const path =
        index.pathIndex !== undefined ? await this.db.pathIndex.get(index.pathIndex) : undefined;

      items.push({
        operationId: operationId?.value,
        operation: operation?.value,
        path: path?.value,
        method: "FOO", // FIXME
        test: data.value,
      });
    }

    return {
      items,
      pages,
      current: pageIndex,
      total: found.length,
    };
  }

  private async readHappyPathIndex(
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined
  ) {
    if (this.happyPathIndex !== undefined) {
      // use cached happy path index, disregard sort for now as it is not being used
      return this.happyPathIndex;
    }

    const orderBy = sort?.fieldName || "pathIndex";

    const index = await this.db.happyPathIndex.orderBy(orderBy).toArray();

    if (sort?.order === "desc") {
      index.reverse();
    }

    this.happyPathIndex = index;

    return index;
  }

  private async readTestIndex(sort: { fieldName: string; order?: "asc" | "desc" } | undefined) {
    if (this.testIndex !== undefined) {
      // use cached test index, disregard sort for now as it is not being used
      return this.testIndex;
    }

    const orderBy = sort?.fieldName || "pathIndex";

    const index = await this.db.testIndex.orderBy(orderBy).toArray();

    if (sort?.order === "desc") {
      index.reverse();
    }

    this.testIndex = index;

    return index;
  }
}

function paginate(array: any[], page: number, perPage: number): any[] {
  const start = page * perPage;
  const end = start + perPage;
  return array.slice(start, end);
}
