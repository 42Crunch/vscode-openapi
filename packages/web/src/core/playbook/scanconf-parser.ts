import { NullableResult, Result } from "@xliic/common/result";
import { find, parseJsonPointer } from "@xliic/common/jsonpointer";

import * as playbook from "@xliic/common/playbook";
import * as scan from "./scanconfig";

import { BundledSwaggerOrOasSpec, getOperationById } from "@xliic/common/openapi";
import { joinJsonPointer } from "@xliic/preserving-json-yaml-parser";

export function parse(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle
): Result<playbook.PlaybookBundle, ParsingErrors> {
  const [result, errors] = parseInternal(oas, file);
  if (errors == undefined) {
    return [result, undefined];
  }

  return [
    undefined,
    errors.map((error) => ({
      message: error.message.slice(-1).join(": "),
      pointer: joinJsonPointer(error.path),
    })),
  ];
}

export function parseInternal(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle
): Result<playbook.PlaybookBundle, InternalParsingErrors> {
  return result<playbook.PlaybookBundle>({
    before: parseArray(oas, file, file.before || [], parseRequestStage),
    after: parseArray(oas, file, file.after || [], parseRequestStage),
    operations: parseMap(oas, file, file.operations || {}, parseOperation),
    authenticationDetails: parseArray(
      oas,
      file,
      file.authenticationDetails || [],
      parseCredentials
    ),
    runtimeConfiguration: parseruntimeConfiguration(oas, file, file.runtimeConfiguration || {}),
    customizations: value(file.customizations),
    environments: parseMap(oas, file, file.environments || {}, parseEnvironmentFile),
    authorizationTests: value(file.authorizationTests),
    requests: parseMap(oas, file, file.requests || {}, parseRequestFile),
  });
}

function parseruntimeConfiguration(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  entry: scan.RuntimeConfiguration
): Result<playbook.RuntimeConfiguration, InternalParsingErrors> {
  return [{ ...entry }, undefined];
}

function parseEnvironmentFile(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  entry: scan.EnvironmentFile
): Result<playbook.PlaybookEnvironment, InternalParsingErrors> {
  return result<playbook.PlaybookEnvironment>({
    variables: parseMap(oas, file, entry.variables || {}, parseEnvironmentVariable),
  });
}

function parseEnvironmentVariable(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  entry: any
): Result<playbook.PlaybookEnvironmentVariable, InternalParsingErrors> {
  if (entry.from !== "environment") {
    return makeErrorResult("unknown env from");
  }

  return result<playbook.PlaybookEnvironmentVariable>({
    name: value(entry.name),
    from: value(entry.from),
    required: value(entry.required),
    default: value(entry.default),
  });
}

function parseOperation(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  operation: scan.Operation
): Result<playbook.Operation, InternalParsingErrors> {
  return result<playbook.Operation>({
    request: parseRequestStageContent(oas, file, operation.request, operation.operationId),
    operationId: value(operation.operationId),
    before: parseArray(oas, file, operation.before || [], parseRequestStage),
    after: parseArray(oas, file, operation.after || [], parseRequestStage),
    authorizationTests: value(operation.authorizationTests),
    scenarios: parseArray(oas, file, operation.scenarios || [], parseScenario),
    customTests: value(operation.customTests),
  });
}

function parseRequestStage(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  entry: scan.RequestStageContent | scan.RequestStageReference
): Result<playbook.Stage, InternalParsingErrors> {
  if (entry.$ref !== undefined) {
    // scanconf schema has "[k: string]: unknown;" makin $ref unusable to infer type, TODO fix schema
    return parseRequestStageReference(oas, file, entry as scan.RequestStageReference);
  } else {
    return parseRequestStageContent(oas, file, entry as scan.RequestStageContent);
  }
}

function parseRequestStageReference(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  reference: scan.RequestStageReference
): Result<playbook.StageReference, InternalParsingErrors> {
  return result<playbook.StageReference>({
    responses: parseMap(oas, file, reference.responses || {}, parseResponse),
    auth: value(reference.auth || []),
    ref: parseRequestRef(oas, file, reference.$ref as string),
    fuzzing: value(reference.fuzzing),
    environment: parseCtxVariables(oas, file, reference.environment || {}),
    injectionKey: value(reference.injectionKey),
    expectedResponse: value(reference.expectedResponse),
  });
}

function parseRequestStageContent(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  content: scan.RequestStageContent,
  operationId?: string
): Result<playbook.StageContent, InternalParsingErrors> {
  return result<playbook.StageContent>({
    responses: parseMap(oas, file, content.responses || {}, parseResponse),
    fuzzing: value(content.fuzzing),
    auth: value(content.auth || []),
    environment: parseCtxVariables(oas, file, content.environment || {}),
    injectionKey: value(content.injectionKey),
    ref: value(undefined),
    defaultResponse: value(content.defaultResponse),
    request: parseRequestRequest(oas, file, content.request, operationId),
    operationId: value(operationId),
  });
}

function parseRequestExternalStageContent(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  content: scan.RequestStageContent
): Result<playbook.ExternalStageContent, InternalParsingErrors> {
  return result<playbook.ExternalStageContent>({
    operationId: [undefined, undefined],
    responses: parseMap(oas, file, content.responses || {}, parseResponse),
    environment: parseCtxVariables(oas, file, content.environment || {}),
    defaultResponse: value(content.defaultResponse),
    request: parseExternalRequestRequest(oas, file, content.request),
  });
}

function parseRequestFile(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  content: scan.RequestFile
): Result<playbook.StageContent | playbook.ExternalStageContent, InternalParsingErrors> {
  if (content.operationId === undefined) {
    return parseRequestExternalStageContent(oas, file, content);
  } else {
    return parseRequestStageContent(oas, file, content, content.operationId);
  }
}

function parseRequestRequest(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  request: scan.CRequest | scan.HttpRequest,
  operationId?: string
): Result<playbook.CRequest, InternalParsingErrors> {
  // FIXME check that operationId is the same as request.operationId
  if (request.type === "42c") {
    return parseCRequest(oas, file, request, operationId);
  }
  return makeErrorResult(`unknown request type: ${request.type}`);
}

function parseExternalRequestRequest(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  request: scan.CRequest | scan.HttpRequest
): Result<playbook.ExternalCRequest, InternalParsingErrors> {
  if (request.type === "42c") {
    return parseExternalCRequest(oas, file, request);
  }
  return makeErrorResult(`unknown request type: ${request.type}`);
}

function parseCRequest(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  request: scan.CRequest,
  operationId?: string
): Result<playbook.CRequest, InternalParsingErrors> {
  const effectiveOperationId = request?.details?.operationId || operationId;

  if (effectiveOperationId === undefined) {
    return [
      undefined,
      makeError("Unable to parse request that has no operationId set", undefined, ["details"]),
    ];
  }

  const operation = getOperationById(oas, effectiveOperationId);

  if (operation === undefined) {
    return makeErrorResult(
      `Unable to find in the OpenAPI file an operation with operationId: "${effectiveOperationId}"`
    );
  }

  return result<playbook.CRequest>({
    operationId: value(effectiveOperationId),
    path: value(operation.path),
    method: value(operation.method.toLowerCase()),
    parameters: parseParameters(oas, file, request?.details || {}),
    body: parseRequestBody(oas, file, request?.details?.requestBody),
  });
}

function parseExternalCRequest(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  request: scan.CRequest
): Result<playbook.ExternalCRequest, InternalParsingErrors> {
  return result<playbook.ExternalCRequest>({
    url: value(request.details.url),
    method: value(request.details.method.toLowerCase()),
    parameters: parseParameters(oas, file, request?.details || {}),
    body: parseRequestBody(oas, file, request?.details?.requestBody),
  });
}

function parseRequestBody(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  body: scan.CRequest["details"]["requestBody"]
): NullableResult<playbook.OperationBody | undefined, InternalParsingErrors> {
  if (body === undefined || body === null) {
    return [undefined, undefined];
  }

  if (body.mode === "json") {
    return [{ mediaType: "application/json", value: body.json }, undefined];
  } else if (body.mode === "urlencoded") {
    return [{ mediaType: "application/x-www-form-urlencoded", value: body.urlencoded }, undefined];
  }

  return [undefined, undefined];
}

function parseParameters(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  entry: scan.CRequest["details"]
): Result<playbook.ParameterValues, InternalParsingErrors> {
  return result<playbook.ParameterValues>({
    cookie: parseParametersArray(oas, file, entry.cookies || []),
    path: parseParametersArray(oas, file, entry.paths || []),
    query: parseParametersArray(oas, file, entry.queries || []),
    header: parseParametersArray(oas, file, entry.headers || []),
  });
}

function parseParametersArray(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  parameters: scan.ParametersArray
): Result<{ key: string; value: unknown }[], InternalParsingErrors> {
  return [
    parameters.map(({ key, value }) => {
      // FIXME only allow string values
      return { key, value };
    }),
    undefined,
  ];
}

function parseResponse(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  entry: scan.Response
): Result<playbook.Response, InternalParsingErrors> {
  return result<playbook.Response>({
    expectations: value(entry.expectations),
    variableAssignments: parseMap(
      oas,
      file,
      entry.variableAssignments || {},
      parseVariableAssigmment
    ),
  });
}

function parseVariableAssigmment(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  assignment:
    | scan.VariableAssignmentsHardcoded
    | scan.VariableAssignmentsContext
    | scan.VariableAssignmentsParameter
    | scan.VariableAssignmentsBody
): Result<playbook.VariableAssignment, InternalParsingErrors> {
  if (assignment.in === "body" && (assignment.from == "response" || assignment.from == "request")) {
    return [
      {
        in: assignment.in,
        from: assignment.from,
        contentType: "json",
        path: {
          type: assignment.path?.type!,
          value: assignment.path?.value!,
        },
      },
      undefined,
    ];
  } else if (
    (assignment.in === "header" || assignment.in === "query" || assignment.in === "cookie") &&
    (assignment.from == "response" || assignment.from == "request")
  ) {
    return [
      {
        in: assignment.in,
        from: assignment.from,
        name: assignment.name!,
      },
      undefined,
    ];
  }
  return makeErrorResult("unexpected assignment");
}

function parseCtxVariables(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  entry: scan.CtxVariables
): Result<playbook.Environment, InternalParsingErrors> {
  return [entry, undefined];
}

function parseRequestRef(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  ref?: string
): NullableResult<playbook.RequestRef | undefined, InternalParsingErrors> {
  if (ref === undefined) {
    return [undefined, undefined];
  }

  // FIXME, do not fails on a missing references in the stages
  // UI is able to cope with this
  // instead we should log 'error' and show logs somewhere

  // const target = find(file, ref);
  // if (target === undefined) {
  //   return makeErrorResult(`unable to resolve ref: ${ref}`);
  // }

  const path = parseJsonPointer(ref);
  if (path.length === 2 && path[0] === "requests") {
    return [{ type: "request", id: path[1] }, undefined];
  } else if (path.length === 3 && path[0] === "operations" && path[2] === "request") {
    return [{ type: "operation", id: path[1] }, undefined];
  }

  return makeErrorResult(`unexpected stage $ref, must point to operations or requests: ${ref}`);
}

function parseCredentials(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  credential: Record<string, scan.Credential> | { $ref: string }
): Result<playbook.Credentials, InternalParsingErrors> {
  if (credential["$ref"] !== undefined) {
    return makeErrorResult(`external credential refs are not supported: ${credential["$ref"]}`);
  }

  return parseMap(oas, file, credential as Record<string, scan.Credential>, parseCredential);
}

function parseCredential(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  credential: scan.Credential
): Result<playbook.Credential, InternalParsingErrors> {
  return result<playbook.Credential>({
    in: value(credential.in),
    type: value(credential.type),
    name: value(credential.name),
    default: value(credential.default),
    ttl: value(credential.ttl),
    tti: value(credential.tti),
    methods: parseMap(oas, file, credential.credentials || {}, parseCredentialContent),
    description: value(credential.description),
  });
}

function parseCredentialContent(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  credential: scan.CredentialContent
): Result<playbook.CredentialMethod, InternalParsingErrors> {
  return result<playbook.CredentialMethod>({
    description: value(credential.description),
    requests: parseArray(oas, file, credential.requests || [], parseRequestStage),
    credential: value(credential.credential),
  });
}

function parseScenario(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  scenario: scan.HappyPathScenario | scan.UnhappyPathScenario
): Result<playbook.Scenario, InternalParsingErrors> {
  return result<playbook.Scenario>({
    requests: parseArray(oas, file, scenario.requests || [], parseRequestStage),
    key: value(scenario.key),
    fuzzing: value((scenario as scan.HappyPathScenario).fuzzing),
  });
}

export type ParsingError = {
  message: string;
  pointer: string;
};

export type ParsingErrors = ParsingError[];

type InternalParsingError = {
  message: string[];
  path: (string | number)[];
};

type InternalParsingErrors = InternalParsingError[];

function makeError(
  message: string,
  childErrors?: InternalParsingErrors,
  path?: number | string | (string | number)[]
): InternalParsingErrors {
  let errorPath: (string | number)[] = [];
  if (path !== undefined && (typeof path === "string" || typeof path === "number")) {
    errorPath = [`${path}`];
  } else if (path !== undefined && Array.isArray(path)) {
    errorPath = [...path];
  }

  if (childErrors === undefined) {
    return [{ message: [message], path: errorPath }];
  }

  return childErrors.map((childError) => ({
    message: [message, ...childError.message],
    path: [...errorPath, ...childError.path],
  }));
}

function makeErrorResult(
  message: string,
  childErrors?: InternalParsingErrors,
  path?: number | string | string[]
): [undefined, InternalParsingErrors] {
  return [undefined, makeError(message, childErrors, path)];
}

function result<O>(
  input: Record<keyof O, NullableResult<unknown, InternalParsingErrors>>
): Result<O, InternalParsingErrors> {
  const errors: InternalParsingErrors = [];
  const map: Record<string, unknown> = {};

  for (const [key, result] of Object.entries(input)) {
    const [value, error] = result as Result<unknown, InternalParsingErrors>;
    if (error !== undefined) {
      errors.push(...makeError(`failed to parse`, error, [key]));
    } else {
      map[key] = value;
    }
  }

  if (errors.length > 0) {
    return [undefined, errors];
  }

  return [map as any, undefined];
}

function value<X>(input: X): NullableResult<X, InternalParsingErrors> {
  return [input, undefined];
}

function parseMap<I, O>(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  input: Record<string, I>,
  transform: (
    oas: BundledSwaggerOrOasSpec,
    file: scan.ConfigurationFileBundle,
    entry: I
  ) => Result<O, InternalParsingErrors>
): Result<Record<string, O>, InternalParsingErrors> {
  const errors: InternalParsingErrors = [];
  const map: Record<string, O> = {};

  const transformed: [string, Result<O, InternalParsingErrors>][] = Object.entries(input).map(
    ([key, value]) => [key, transform(oas, file, value)]
  );

  for (const [key, result] of transformed) {
    const [value, error] = result;
    if (error !== undefined) {
      errors.push(...makeError(`failed to parse`, error, [key]));
    } else {
      map[key] = value;
    }
  }

  if (errors.length > 0) {
    return [undefined, errors];
  }

  return [map, undefined];
}

function parseArray<I, O>(
  oas: BundledSwaggerOrOasSpec,
  file: scan.ConfigurationFileBundle,
  input: I[],
  transform: (
    oas: BundledSwaggerOrOasSpec,
    file: scan.ConfigurationFileBundle,
    entry: I
  ) => Result<O, InternalParsingErrors>
): Result<O[], InternalParsingErrors> {
  const errors: InternalParsingErrors = [];
  const array: O[] = [];

  const transformed: Result<O, InternalParsingErrors>[] = (input || []).map((value) =>
    transform(oas, file, value)
  );

  for (const [index, result] of transformed.entries()) {
    const [value, error] = result;
    if (error !== undefined) {
      errors.push(...makeError(`failed to parse`, error, [index]));
    } else {
      array.push(value);
    }
  }

  if (errors.length > 0) {
    return [undefined, errors];
  }

  return [array, undefined];
}
