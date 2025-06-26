import { HappyPathReport, RuntimeOperationReport, TestLogReport } from "@xliic/common/scan-report";
import {
  StringIndex,
  Collection,
  CollectionWithMutableIndexes,
  SortableStringIndex,
  MutableId,
} from "@xliic/streaming-parser";

type TestIndex = {
  id: number;
  operationIdIndex: MutableId | undefined;
  pathIndex: MutableId | undefined;
  methodIndex: number | undefined;
  testKeyIndex: number;
  criticality: number;
  testType: number;
};

type HappyPathIndex = {
  id: number;
  operationIdIndex: MutableId;
  pathIndex: MutableId | undefined;
  methodIndex: number | undefined;
};

export function stores() {
  return {
    pathIndex: new SortableStringIndex(),
    operationIdIndex: new SortableStringIndex(),
    testKeyIndex: new StringIndex(),

    test: new Collection<TestLogReport>(),
    happyPath: new Collection<HappyPathReport>(),
    operation: new CollectionWithMutableIndexes<RuntimeOperationReport>({ mutable: ["id"] }),

    testIndex: new CollectionWithMutableIndexes<TestIndex>({
      flat: true,
      mutable: ["operationIdIndex", "pathIndex"],
      sortable: ["pathIndex", "criticality"],
    }),

    happyPathIndex: new CollectionWithMutableIndexes<HappyPathIndex>({
      flat: true,
      mutable: ["operationIdIndex", "pathIndex"],
      sortable: ["pathIndex"],
    }),
  };
}
