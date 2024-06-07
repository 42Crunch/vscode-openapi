import { HttpMethod } from "@xliic/openapi";

export type Bundle = {
  runtimeConfiguration?: RuntimeConfiguration;
  customizations?: unknown;
  environments: Record<string, Environment>;
  operations: Record<string, Operation>;
  authenticationDetails: [Credentials, ...Credentials[]];
  before: Stage[];
  after: Stage[];
  authorizationTests: AuthorizationTests;
  requests: Record<string, StageContent | ExternalStageContent>;
};

export type ParameterLocation = "query" | "header" | "path" | "cookie";
export type ParameterList = { key: string; value: unknown }[];
export type ParameterValues = Record<ParameterLocation, ParameterList>;

export type OperationBody =
  | {
      mediaType: "application/json";
      value: unknown;
    }
  | {
      mediaType: "application/x-www-form-urlencoded";
      value: Record<string, unknown>;
    }
  | {
      mediaType: "raw";
      value: unknown;
    };

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
  variableAssignments: VariableAssignments;
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

export type Environment = {
  variables: Record<string, EnvironmentVariable | EnvironmentConstant>;
};

export type EnvironmentVariable = {
  from: "environment";
  name: string;
  required: boolean;
  default: unknown;
};

export type EnvironmentConstant = {
  from: "hardcoded";
  value: unknown;
};

export type Operation = {
  operationId: string;
  request: StageContent;
  scenarios: Scenario[];
  before: Stage[];
  after: Stage[];
  authorizationTests: string[];
  customTests?: unknown;
  customized: boolean;
};

export type Scenario = {
  fuzzing?: boolean;
  key: string;
  requests: Stage[];
};

export type Scenarios = {
  scenarios: Scenario[];
};

export type RequestRef = { type: "operation"; id: string } | { type: "request"; id: string };

export type OperationEnvironment = Record<string, unknown>;

export type StageReference = {
  fuzzing?: boolean;
  auth?: string[];
  environment?: OperationEnvironment;
  responses?: Responses;
  expectedResponse?: string;
  injectionKey?: string;
  ref: RequestRef;
};

export type StageContent = {
  ref: undefined;
  fuzzing?: boolean;
  auth?: string[];
  environment?: OperationEnvironment;
  responses: Responses;
  defaultResponse: string;
  injectionKey?: string;
  request: CRequest;
  operationId: string;
};

export type ExternalStageContent = {
  operationId: undefined;
  environment?: OperationEnvironment;
  responses: Responses;
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

export type AuthArray = string[]; // for now Credentials are not supported in AuthArray, just strings

export type AuthenticationSwappingTest = {
  key: "authentication-swapping-bola" | "authentication-swapping-bfla";
  source: AuthArray;
  target: AuthArray;
};

export type AuthorizationTests = Record<string, AuthenticationSwappingTest>;

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

export function getCurrentEnvironment(playbook: Bundle): Environment {
  const environment = playbook.runtimeConfiguration?.environment || "default";
  return playbook.environments[environment];
}
