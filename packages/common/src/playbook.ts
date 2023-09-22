import { HttpMethod } from "./http";
import { BundledSwaggerOrOasSpec } from "./openapi";

export interface OasWithPlaybook {
  oas: BundledSwaggerOrOasSpec;
  path: string;
  method: HttpMethod;
  scanconf: string;
}

export type ParameterLocation = "query" | "header" | "path" | "cookie";
export type ParameterList = { key: string; value: unknown }[];
export type ParameterValues = Record<ParameterLocation, ParameterList>;

export interface OperationBody {
  mediaType: string;
  value: unknown;
}

export type CRequest = {
  operationId: string;
  path: string;
  method: HttpMethod;
  parameters: ParameterValues;
  body?: OperationBody;
};

export type ExternalCRequest = {
  url: string;
  method: HttpMethod;
  parameters: ParameterValues;
  body?: OperationBody;
};

export type Responses = Record<string, Response>;

export type Response = {
  variableAssignments?: VariableAssignments;
  expectations: unknown;
};

export type VariableAssignments = Record<string, VariableAssignment>;

export type VariableAssignment = VariableAssignmentsBody | VariableAssignmentsParameter;

export type VariableAssignmentsBody = {
  from: "request" | "response";
  in: "body";
  contentType: "json";
  path: {
    type: "jsonPointer" | "jsonPath";
    value: string;
  };
};

export type VariableAssignmentsParameter = {
  from: "request" | "response";
  in: "query" | "header" | "path" | "cookie";
  name: string;
};

// vs code to webapp requests
export type TryScenarioMessage = { command: "tryScenario"; payload: OasWithPlaybook };
export type LoadScanconfMessage = {
  command: "loadScanconf";
  payload: {
    oas: BundledSwaggerOrOasSpec;
    scanconf: string;
    uri: string;
  };
};
export type UpdateScanconfMessage = { command: "updateScanconf"; payload: string };
export type ShowAuthWindow = { command: "showAuthWindow"; payload: undefined };

// webapp to vs code responses
export type SaveScanconfMessage = {
  command: "saveScanconf";
  payload: string;
};

export type PlaybookBundle = {
  runtimeConfiguration?: RuntimeConfiguration;
  customizations?: unknown;
  environments: Record<string, PlaybookEnvironment>;
  operations: Record<string, Operation>;
  authenticationDetails: Credentials[];
  before: Stage[];
  after: Stage[];
  authorizationTests?: unknown;
  requests: Record<string, StageContent | ExternalStageContent>;
};

export type RuntimeConfiguration = {
  environment?: string;
  logLevel?: "debug" | "info" | "error" | "critical";
  logDestination?: string;
  logMaxFileSize?: number;
  requestHeaderNameRequestId?: string;
  requestHeaderNameScenarioId?: string;
  requestFlowrate?: number;
  requestTimeout?: number;
  requestTlsInsecureSkipVerify?: boolean;
  responseFollowRedirection?: boolean;
  happyPathOnly?: boolean;
  maxScanDuration?: number;
  memoryLimit?: number;
  memoryTimeSpan?: number;
  responseMaxBodySizeScan?: number;
  reportIndexed?: boolean;
  reportPrettify?: boolean;
  reportMaxHttpResponseSizeHappyPath?: number;
  reportMaxBodySizeHappyPath?: number;
  reportMaxHttpResponseSizeTest?: number;
  reportMaxBodySizeTest?: number;
  reportIssuesOnly?: boolean;
  reportMaxIssues?: number;
  reportMaxSize?: number;
  reportGenerateCurlCommand?: boolean;
};

export type PlaybookEnvironment = {
  variables: Record<string, PlaybookEnvironmentVariable>;
};

export type PlaybookEnvironmentVariable = {
  from: "environment";
  name: string;
  required: boolean;
  default: unknown;
};

export type Operation = {
  operationId: string;
  request: StageContent;
  scenarios: Scenario[];
  before: Stage[];
  after: Stage[];
  authorizationTests?: unknown;
  customTests?: unknown;
};

export type Scenario = {
  fuzzing?: boolean;
  key: string;
  requests: Stage[];
};

export type Scenarios = {
  scenarios: Scenario[];
};

export type Environment = Record<string, unknown>;

export type RequestRef = { type: "operation"; id: string } | { type: "request"; id: string };

export type StageReference = {
  fuzzing?: boolean;
  auth?: string[];
  environment?: Environment;
  responses?: Responses;
  expectedResponse?: string;
  injectionKey?: string;
  ref: RequestRef;
};

export type StageContent = {
  ref: undefined;
  fuzzing?: boolean;
  auth?: string[];
  environment?: Environment;
  responses?: Responses;
  defaultResponse: string;
  injectionKey?: string;
  request: CRequest;
  operationId: string;
};

export type ExternalStageContent = {
  operationId: undefined;
  environment?: Environment;
  responses?: Responses;
  defaultResponse: string;
  request: ExternalCRequest;
};

export type Stage = StageReference | StageContent;

export type Credential = {
  type: "basic" | "bearer" | "apiKey" | "oauth2" | "openIdConnect";
  default: string;
  in?: string;
  name?: string;
  ttl?: string;
  tti?: string;
  methods: Record<string, CredentialMethod>;
  description?: string;
};

export type CredentialRef = {
  $ref: string;
};

export type CredentialMethod = {
  requests: Stage[];
  credential: string;
  description?: string;
};

export type Credentials = Record<string, Credential>;

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
