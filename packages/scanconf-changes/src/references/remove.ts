import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { Scanconf } from "@xliic/scanconf";

import { StageLocation } from "./types";

export function removeReferences(
  scanconf: Scanconf.ConfigurationFileBundle,
  references: StageLocation[]
): Scanconf.ConfigurationFileBundle {
  const updated = simpleClone(scanconf);
  for (const reference of references) {
    if (reference.container === "globalBefore") {
      clearContainer(updated.before, reference.stageIndex);
    } else if (reference.container === "globalAfter") {
      clearContainer(updated.after, reference.stageIndex);
    } else if (reference.container === "operationBefore") {
      clearContainer(updated.operations![reference.operationId].before, reference.stageIndex);
    } else if (reference.container === "operationAfter") {
      clearContainer(updated.operations![reference.operationId].after, reference.stageIndex);
    } else if (reference.container === "operationScenarios") {
      clearContainer(
        updated.operations![reference.operationId].scenarios[reference.scenarioIndex].requests,
        reference.stageIndex
      );
    }
  }

  compactScanconfReferences(updated);

  return updated;
}

function clearContainer(container: Scanconf.RequestsStage | undefined, index: number) {
  if (container) {
    (container as any)[index] = undefined;
  }
}

function compactScanconfReferences(scanconf: Scanconf.ConfigurationFileBundle) {
  compactContainer(scanconf.before);
  compactContainer(scanconf.after);

  for (const operation of Object.values(scanconf.operations || {})) {
    compactContainer(operation.before);
    compactContainer(operation.after);
    for (const scenario of operation.scenarios) {
      compactContainer(scenario.requests);
    }
  }

  for (const group of scanconf.authenticationDetails || []) {
    // TODO: handle $ref only credentials
    for (const credential of Object.values(group) as Scanconf.Credential[]) {
      for (const credentialValue of Object.values(credential.credentials)) {
        compactContainer(credentialValue.requests);
      }
    }
  }
}

function compactContainer(container: Scanconf.RequestsStage | undefined) {
  if (container !== undefined) {
    for (let i = container.length - 1; i >= 0; i--) {
      if (container[i] === undefined) {
        container.splice(i, 1);
      }
    }
  }
}
