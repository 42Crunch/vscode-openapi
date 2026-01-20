import { Playbook } from "@xliic/scanconf";
import { getRequestByRef } from "../playbook/execute";

export function getScenario(
  playbook: Playbook.Bundle,
  operationId: string
): Playbook.Scenario | undefined {
  const operation = playbook.operations[operationId];
  // use first scenario for now
  return operation?.scenarios?.[0];
}

export function hasUniqueOperationIdsOnly(
  playbook: Playbook.Bundle,
  scenario: Playbook.Scenario
): boolean {
  const operationIds: string[] = [];
  for (const stage of scenario.requests) {
    if (stage.ref === undefined) {
      // only references are supported in Scenario.requests for now
      return false;
    }
    const request = getRequestByRef(playbook, stage.ref);
    if (request.operationId === undefined) {
      // skip all external requests
      continue;
    }
    operationIds.push(request.operationId);
  }
  return new Set(operationIds).size === operationIds.length;
}

export function getPathParameters(operation: Playbook.Operation): boolean {
  const parameters = operation.request.request.parameters;
  return parameters.path.length > 0;
}

export function getPosition(
  playbook: Playbook.Bundle,
  scenario: Playbook.Scenario,
  operationId: string
): number | undefined {
  for (let i = 0; i < scenario.requests.length; i++) {
    const stage = scenario.requests[i];

    if (stage.ref === undefined) {
      continue;
    }

    const request = getRequestByRef(playbook, stage.ref);
    if (request.operationId === operationId) {
      return i;
    }
  }
  return undefined;
}
