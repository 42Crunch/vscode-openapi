import { joinJsonPointer } from "@xliic/preserving-json-yaml-parser";
import { Scanconf } from "@xliic/scanconf";

export type StageLocationGlobalBefore = {
  container: "globalBefore";
  stageIndex: number;
};

export type StageLocationGlobalAfter = {
  container: "globalAfter";
  stageIndex: number;
};

export type StageLocationOperationBefore = {
  container: "operationBefore";
  operationId: string;
  stageIndex: number;
};

export type StageLocationOperationAfter = {
  container: "operationAfter";
  operationId: string;
  stageIndex: number;
};

export type StageLocationOperationScenarios = {
  container: "operationScenarios";
  operationId: string;
  scenarioIndex: number;
  stageIndex: number;
};

export type StageLocationCredential = {
  container: "credential";
  group: number;
  credentialId: string;
  subCredentialId: string;
  stageIndex: number;
};

export type StageLocation =
  | StageLocationGlobalBefore
  | StageLocationGlobalAfter
  | StageLocationOperationBefore
  | StageLocationOperationAfter
  | StageLocationOperationScenarios
  | StageLocationCredential;

export type StageLocationName = StageLocation["container"];

export type StageContainer =
  | Omit<StageLocationGlobalBefore, "stageIndex">
  | Omit<StageLocationGlobalAfter, "stageIndex">
  | Omit<StageLocationOperationBefore, "stageIndex">
  | Omit<StageLocationOperationAfter, "stageIndex">
  | Omit<StageLocationOperationScenarios, "stageIndex">
  | Omit<StageLocationCredential, "stageIndex">;

export function findReferences(
  scanconf: Scanconf.ConfigurationFileBundle,
  operationId: string
): StageLocation[] {
  const globalBefore: StageLocationGlobalBefore[] = findReferencesInContainer(
    scanconf.before || [],
    operationId
  ).map((index) => ({ container: "globalBefore", stageIndex: index }));

  const globalAfter: StageLocationGlobalAfter[] = findReferencesInContainer(
    scanconf.after || [],
    operationId
  ).map((index) => ({ container: "globalAfter", stageIndex: index }));

  const operationsReferences = Object.entries(scanconf.operations || {}).flatMap(
    ([id, operation]) => {
      return id !== operationId ? findReferencesInOperation(operation, id, operationId) : [];
    }
  );

  const credentialReferences = (scanconf.authenticationDetails || []).flatMap(
    // TODO: handle credentials that contain just a $ref
    (group, groupIndex) =>
      Object.entries(group as Record<string, Scanconf.Credential>).flatMap(
        ([credentialId, credential]) =>
          findReferencesInCredential(credential, credentialId, groupIndex, operationId)
      )
  );

  return [...globalBefore, ...globalAfter, ...credentialReferences, ...operationsReferences];
}

function findReferencesInOperation(
  operation: Scanconf.Operation,
  operationId: string,
  targetOperationId: string
): StageLocation[] {
  const operationBefore: StageLocationOperationBefore[] = findReferencesInContainer(
    operation.before || [],
    targetOperationId
  ).map((index) => ({ container: "operationBefore", operationId, stageIndex: index }));

  const operationAfter: StageLocationOperationAfter[] = findReferencesInContainer(
    operation.after || [],
    targetOperationId
  ).map((index) => ({ container: "operationAfter", operationId, stageIndex: index }));

  const operationScenarios = operation.scenarios.flatMap((scenario, scenarioIndex) =>
    findReferencesInScenario(scenario, operationId, scenarioIndex, targetOperationId)
  );

  return [...operationBefore, ...operationScenarios, ...operationAfter];
}

function findReferencesInScenario(
  scenario: Scanconf.HappyPathScenario | Scanconf.UnhappyPathScenario,
  operationId: string,
  scenarioIndex: number,
  targetOperationId: string
): StageLocationOperationScenarios[] {
  return findReferencesInContainer(scenario.requests || [], targetOperationId).map((index) => ({
    container: "operationScenarios",
    operationId,
    scenarioIndex,
    stageIndex: index,
  }));
}

function findReferencesInCredential(
  credential: Scanconf.Credential,
  credentialId: string,
  group: number,
  targetOperationId: string
): StageLocationCredential[] {
  return Object.entries(credential.credentials).flatMap(([credentialValueId, credentialValue]) =>
    findReferencesInContainer(credentialValue.requests || [], targetOperationId).map((index) => ({
      container: "credential",
      group,
      credentialId,
      subCredentialId: credentialValueId,
      stageIndex: index,
    }))
  );
}

function findReferencesInContainer(
  container: Scanconf.RequestsStage,
  operationId: string
): number[] {
  const operationRef = "#" + joinJsonPointer(["operations", operationId, "request"]);
  return container
    .map((step, index) => {
      if (isRequestStageReference(step) && step.$ref === operationRef) {
        return index;
      }
    })
    .filter((index) => index !== undefined);
}

function isRequestStageReference(
  step: Scanconf.RequestStageReference | Scanconf.RequestStageContent
): step is Scanconf.RequestStageReference {
  return "$ref" in step;
}
