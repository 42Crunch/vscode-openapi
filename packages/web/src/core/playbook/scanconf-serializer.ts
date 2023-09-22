import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { NullableResult, Result } from "@xliic/common/result";
import { joinJsonPointer } from "@xliic/preserving-json-yaml-parser";

import * as scan from "./scanconfig";

export function serialize(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle
): Result<scan.ConfigurationFileBundle, string> {
  const runtimeConfiguration = file.runtimeConfiguration as scan.RuntimeConfiguration;
  const customizations = file.customizations as scan.Customizations;
  const environments = file.environments as Record<string, scan.EnvironmentFile>;

  const [authenticationDetails, authError] = serializeAuthenticationDetails(
    oas,
    file,
    file.authenticationDetails
  );
  if (authError !== undefined) {
    return [undefined, `failed to serialize authentication details: ${authError}`];
  }

  const [operations, operationsError] = serializeOperations(oas, file);
  if (operationsError !== undefined) {
    return [undefined, `failed to serialize operations: ${operationsError}`];
  }

  const [requests, requestsError] = serializeRequests(oas, file, file.requests);
  if (requestsError !== undefined) {
    return [undefined, `unable to serialize requests: ${requestsError}`];
  }

  const [before, beforeError] = serializeRequestsStage(oas, file, file.before);
  if (beforeError !== undefined) {
    return [undefined, `unable to serialize before: ${beforeError}`];
  }

  const [after, afterError] = serializeRequestsStage(oas, file, file.after);
  if (afterError !== undefined) {
    return [undefined, `unable to serialize after: ${afterError}`];
  }

  return [
    {
      version: "2.0.0",
      runtimeConfiguration,
      customizations,
      environments,
      operations,
      before: before.length > 0 ? before : undefined,
      after: after.length > 0 ? after : undefined,
      authenticationDetails,
      authorizationTests: file.authorizationTests as any,
      requests: Object.keys(requests).length > 0 ? requests : undefined,
    },
    undefined,
  ];
}

function serializeAuthenticationDetails(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  credentials: playbook.Credentials[]
): Result<Record<string, scan.Credential>[], string> {
  const result = [];
  for (const credential of credentials) {
    const [detail, detailError] = serializeAuthenticationDetail(oas, file, credential);
    if (detailError !== undefined) {
      return [undefined, "xxx"];
    }
    result.push(detail);
  }
  return [result, undefined];
}

function serializeAuthenticationDetail(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  credential: playbook.Credentials
): Result<Record<string, scan.Credential>, string> {
  const result: Record<string, scan.Credential> = {};
  for (const [key, value] of Object.entries(credential)) {
    const [credentialContent, credentialContentError] = serializeCredentials(
      oas,
      file,
      value.methods
    );
    if (credentialContentError !== undefined) {
      return [undefined, "xxx"];
    }
    result[key] = {
      type: value.type,
      in: value.in,
      name: value.name,
      ttl: value.ttl,
      tti: value.tti,
      default: value.default,
      description: value.description,
      credentials: credentialContent,
    };
  }
  return [result, undefined];
}

function serializeCredentials(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  methods: Record<string, playbook.CredentialMethod>
): Result<Record<string, scan.CredentialContent>, string> {
  const result: Record<string, scan.CredentialContent> = {};
  for (const [key, value] of Object.entries(methods)) {
    const [requests, requestsError] = serializeRequestsStage(oas, file, value.requests || []);
    if (requestsError !== undefined) {
      return [undefined, `failed to serialize requests: ${requestsError}`];
    }
    result[key] = {
      credential: value.credential,
      description: value.description,
      requests: requests.length > 0 ? requests : undefined,
    };
  }
  return [result, undefined];
}

function serializeOperations(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle
): Result<Record<string, scan.Operation>, string> {
  const result: Record<string, scan.Operation> = {};
  for (const [key, val] of Object.entries(file.operations)) {
    const [operation, error] = serializeOperation(oas, file, val);
    if (error !== undefined) {
      return [undefined, `unable to serialize operation '${key}: ${error}'`];
    }
    result[key] = operation;
  }
  return [result, undefined];
}

function serializeOperation(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  operation: playbook.Operation
): Result<scan.Operation, string> {
  const [request, requestError] = serializeStageContent(
    oas,
    file,
    operation.request,
    operation.operationId
  );
  if (requestError !== undefined) {
    return [undefined, `failed to serialize request: ${requestError}`];
  }

  const [scenarios, scenariosError] = serializeScenarios(oas, file, operation);
  if (scenariosError !== undefined) {
    return [undefined, `failed to serialize scenarios: ${scenariosError}`];
  }

  return [
    {
      operationId: operation.operationId,
      request,
      ...scenarios,
      customTests: operation.customTests as any,
      authorizationTests: operation.authorizationTests as any,
    },
    undefined,
  ];
}

function serializeStageReference(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  stage: playbook.StageReference
): Result<scan.RequestStageReference, string> {
  const [responses, responsesError] = serializeResponses(oas, file, stage.responses);
  if (responsesError !== undefined) {
    return [undefined, `failed to serialize responses: ${responsesError}`];
  }

  const [ref, refError] = serializeRef(stage.ref);
  if (refError !== undefined) {
    return [undefined, `failed to serialize responses: ${refError}`];
  }

  const result = {
    fuzzing: stage.fuzzing,
    $ref: ref,
    auth: serializeAuth(stage.auth),
    expectedResponse: stage.expectedResponse,
    environment: serializeEnvironment(stage.environment),
    responses,
  };

  return [result, undefined];
}

function serializeStageContent(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  stage: playbook.StageContent,
  operationId: string | undefined
): Result<scan.RequestStageContent, string> {
  const [request, requestError] = serializeCRequest(oas, file, stage.request);
  if (requestError !== undefined) {
    return [undefined, `failed to serialize request: ${requestError}`];
  }

  const [responses, responsesError] = serializeResponses(oas, file, stage.responses);

  if (responsesError !== undefined) {
    return [undefined, `failed to serialize responses: ${responsesError}`];
  }

  const result = {
    operationId: operationId || stage.request.operationId,
    fuzzing: stage.fuzzing,
    auth: serializeAuth(stage.auth),
    request: request,
    defaultResponse: stage.defaultResponse,
    environment: serializeEnvironment(stage.environment),
    responses: responses!,
  };

  return [result, undefined];
}

function serializeAuth(auth: string[] | undefined) {
  if (auth === undefined || auth.length === 0) {
    return undefined;
  }
  return auth;
}

function serializeScenarios(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  operation: playbook.Operation
): Result<scan.ScenarioFile, string> {
  const scenarios: scan.HappyPathScenario[] = [];
  for (const tryitScenario of operation.scenarios) {
    const [scenario, error] = serializeScenario(oas, file, tryitScenario);
    if (error !== undefined) {
      return [undefined, `unable to serialize scenario: ${error}`];
    }
    scenarios.push(scenario);
  }

  return [{ scenarios }, undefined];
}

function serializeScenario(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  scenario: playbook.Scenario
): Result<scan.HappyPathScenario, string> {
  const [requests, requestsError] = serializeRequestsStage(oas, file, scenario.requests);
  if (requestsError !== undefined) {
    return [undefined, `unable to serialize requests: ${requestsError}`];
  }

  return [
    {
      key: "happy.path",
      requests,
      fuzzing: scenario.fuzzing,
    },
    undefined,
  ];
}

function serializeRequestsStage(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  requests: playbook.Stage[]
): Result<scan.RequestsStage, string> {
  const result: scan.RequestsStage = [];

  for (const request of requests) {
    if (request.ref === undefined) {
      const [stageContent, stageContentError] = serializeStageContent(
        oas,
        file,
        request,
        undefined
      );
      if (stageContentError !== undefined) {
        return [undefined, `unable to serialize stage: ${stageContentError}`];
      }
      result.push(stageContent);
    } else {
      const [stageReference, stageReferenceError] = serializeStageReference(oas, file, request);
      if (stageReferenceError !== undefined) {
        return [undefined, `unable to serialize stage reference: ${stageReferenceError}`];
      }
      result.push(stageReference);
    }
  }

  return [result, undefined];
}

function serializeRequests(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  requests?: Record<string, playbook.StageContent>
): Result<Record<string, scan.RequestFile>, string> {
  const result: Record<string, scan.RequestFile> = {};

  for (const [key, value] of Object.entries(requests || {})) {
    const [stageContent, stageContentError] = serializeStageContent(
      oas,
      file,
      value,
      value.operationId
    );
    if (stageContentError !== undefined) {
      return [undefined, `unable to serialize request: ${stageContentError}`];
    }
    result[key] = stageContent;
  }

  return [result, undefined];
}

function serializeRef(ref: playbook.StageReference["ref"]): Result<string, string> {
  if (ref.type === "operation") {
    return ["#" + joinJsonPointer(["operations", ref.id, "request"]), undefined];
  } else if (ref.type === "request") {
    return ["#" + joinJsonPointer(["requests", ref.id]), undefined];
  }
  return [undefined, `Unable to serialize unknown $ref type: ${ref}`];
}

function serializeEnvironment(environment?: playbook.Environment): scan.CtxVariables | undefined {
  if (environment === undefined || Object.keys(environment).length === 0) {
    return undefined;
  }

  return environment as scan.CtxVariables;
}

function serializeCRequest(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  request: playbook.CRequest
): Result<scan.CRequest, string> {
  const details: scan.CRequest["details"] = {
    //operationId: operation.operationId,
    method: request.method.toUpperCase() as scan.CRequest["details"]["method"],
    url: `{{host}}${request.path}`,
    headers: serializeRequestParameters(oas, file, request.parameters.header) as any,
    queries: serializeRequestParameters(oas, file, request.parameters.query) as any,
    paths: serializeRequestParameters(oas, file, request.parameters.path) as any,
    cookies: serializeRequestParameters(oas, file, request.parameters.cookie) as any,
  };

  // FIXME better body handling
  if (request.body !== undefined) {
    details.requestBody = {
      mode: "json",
      json: request.body.value as any,
    };
  }

  return [
    {
      type: "42c",
      details,
    },
    undefined,
  ];
}

function serializeResponses(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  responses: playbook.Responses | undefined
): NullableResult<scan.Responses | undefined, string> {
  const result: scan.Responses = {};
  const entries = Object.entries(responses || {});
  if (entries.length === 0) {
    return [undefined, undefined];
  }
  for (const [key, val] of entries) {
    result[key] = {
      expectations: val.expectations as any,
      variableAssignments: serializeVariableAssignments(val.variableAssignments),
    };
  }
  return [result, undefined];
}

function serializeRequestParameters(
  oas: BundledSwaggerOrOasSpec,
  file: playbook.PlaybookBundle,
  parameters?: Record<string, unknown>
) {
  const result = Object.entries(parameters || {}).map(([key, value]) => ({ key, value }));
  if (result.length === 0) {
    return undefined;
  }
  return result;
}

function serializeVariableAssignments(
  assignments: playbook.VariableAssignments | undefined
): scan.VariableAssignments | undefined {
  const keys = Object.keys(assignments || {});
  if (keys.length === 0) {
    return undefined;
  }
  return assignments as scan.VariableAssignments;
}
