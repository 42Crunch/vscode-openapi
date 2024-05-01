import { OperationAdded, OperationRemoved, OperationRenamed } from "./types";

export function findRenamedOperations(
  addedOperations: OperationAdded[],
  removedOperations: OperationRemoved[]
): OperationRenamed[] {
  const renamed: OperationRenamed[] = [];

  for (const added of addedOperations) {
    for (const removed of removedOperations) {
      if (isRenameOperation(added, removed)) {
        renamed.push({
          type: "operation-renamed",
          path: added.path,
          method: added.method,
          oldOperationId: removed.operationId,
          newOperationId: added.operationId,
        });
      }
    }
  }

  return renamed;
}

function isRenameOperation(added: OperationAdded, removed: OperationRemoved): boolean {
  return added.path === removed.path && added.method === removed.method;
}
