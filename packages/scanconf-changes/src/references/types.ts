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
