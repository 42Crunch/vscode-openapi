import { Playbook } from "@xliic/scanconf";

export function getScenario(
  playbook: Playbook.Bundle,
  operationId: string
): Playbook.Scenario | undefined {
  const operation = playbook.operations[operationId];
  // use first scenario for now
  return operation?.scenarios?.[0];
}

export function hasPathOrQueryParameters(operation: Playbook.Operation): boolean {
  const parameters = operation.request.request.parameters;
  return parameters.path.length > 0 || parameters.query.length > 0;
}
