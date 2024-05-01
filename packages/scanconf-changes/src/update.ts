import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Scanconf } from "@xliic/scanconf";
import { joinJsonPointer, simpleClone } from "@xliic/preserving-json-yaml-parser";

import { Change, OperationAdded, OperationRemoved, OperationRenamed } from "./types";
import { removeReferences } from "./references/remove";
import { updateReferences } from "./references/update";

export function update(
  oas: BundledSwaggerOrOasSpec,
  original: Scanconf.ConfigurationFileBundle,
  updated: Scanconf.ConfigurationFileBundle,
  changes: Change[]
): Scanconf.ConfigurationFileBundle {
  let result = simpleClone(original);
  for (const change of changes) {
    if (change.type === "operation-added") {
      result = updateAddOperation(oas, result, updated, change);
    } else if (change.type === "operation-removed") {
      result = updateRemoveOperation(oas, result, updated, change);
    } else if (change.type === "operation-renamed") {
      result = updateRenameOperation(result, change);
    }
  }
  return result;
}

export function updateAddOperation(
  oas: BundledSwaggerOrOasSpec,
  target: Scanconf.ConfigurationFileBundle,
  updated: Scanconf.ConfigurationFileBundle,
  change: OperationAdded
): Scanconf.ConfigurationFileBundle {
  const operation = updated.operations![change.operationId];
  target.operations![change.operationId] = operation;
  return target;
}

export function updateRemoveOperation(
  oas: BundledSwaggerOrOasSpec,
  target: Scanconf.ConfigurationFileBundle,
  updated: Scanconf.ConfigurationFileBundle,
  change: OperationRemoved
): Scanconf.ConfigurationFileBundle {
  delete target.operations![change.operationId];
  return removeReferences(target, change.references);
}

export function updateRenameOperation(
  target: Scanconf.ConfigurationFileBundle,
  change: OperationRenamed
): Scanconf.ConfigurationFileBundle {
  const operation = target.operations![change.oldOperationId];
  operation.operationId = change.newOperationId;
  operation.request.operationId = change.newOperationId;
  if (operation.request?.request?.type === "42c") {
    operation.request.request.details.operationId = change.newOperationId;
  }
  delete target.operations![change.oldOperationId];
  target.operations![change.newOperationId] = operation;
  const oldRef = "#" + joinJsonPointer(["operations", change.oldOperationId, "request"]);
  const newRef = "#" + joinJsonPointer(["operations", change.newOperationId, "request"]);
  return updateReferences(target, oldRef, newRef);
}
