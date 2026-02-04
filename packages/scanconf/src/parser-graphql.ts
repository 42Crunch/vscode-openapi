import { BundledSwaggerOrOasSpec, getOperationById } from "@xliic/openapi";
import { NullableResult, Result } from "@xliic/result";
import { joinJsonPointer, parseJsonPointer } from "@xliic/preserving-json-yaml-parser";

import * as scan from "./scanconfig";
import * as playbook from "./playbook";

export function parse2(file: scan.ConfigurationFileBundle): Result<playbook.Bundle, ParsingErrors> {
  const [result, errors] = parseInternal(file);
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
  file: scan.ConfigurationFileBundle
): Result<playbook.Bundle, InternalParsingErrors> {
  return result<playbook.Bundle>({
    before: parseArray(file, file.before || [], parseRequestStage),
    after: parseArray(file, file.after || [], parseRequestStage),
    operations: parseMap(file, file.operations || {}, parseOperation),
    authenticationDetails: parseArray(
      file,
      file.authenticationDetails === undefined || file.authenticationDetails.length === 0
        ? [{}]
        : file.authenticationDetails,
      parseCredentials
    ),
    runtimeConfiguration: parseruntimeConfiguration(file, file.runtimeConfiguration || {}),
    customizations: value(file.customizations),
    environments: parseMap(file, file.environments || {}, parseEnvironmentFile),
    authorizationTests: parseMap(
      file,
      file.authorizationTests || {},
      parseAuthenticationSwappingTest
    ),
    requests: parseMap(file, file.requests || {}, parseRequestFile),
  });
}

function parseruntimeConfiguration(
  file: scan.ConfigurationFileBundle,
  entry: scan.RuntimeConfiguration
): Result<playbook.RuntimeConfiguration, InternalParsingErrors> {
  return [{ ...entry }, undefined];
}

function parseEnvironmentFile(
  file: scan.ConfigurationFileBundle,
  entry: scan.EnvironmentFile
): Result<playbook.Environment, InternalParsingErrors> {
  return result<playbook.Environment>({
    variables: parseMap(file, entry.variables || {}, parseEnvironmentVariable),
  });
}

function parseEnvironmentVariable(
  file: scan.ConfigurationFileBundle,
  entry: any
): Result<playbook.EnvironmentVariable | playbook.EnvironmentConstant, InternalParsingErrors> {
  if (entry.from === "environment") {
    return result<playbook.EnvironmentVariable>({
      name: value(entry.name),
      from: value(entry.from),
      required: value(entry.required),
      default: value(entry.default),
    });
  }

  if (entry.from === "hardcoded") {
    return result<playbook.EnvironmentConstant>({
      from: value(entry.from),
      value: value(entry.value),
    });
  }

  return makeErrorResult("unknown env from");
}

function parseOperation(
  file: scan.ConfigurationFileBundle,
  operation: scan.Operation
): Result<playbook.Operation, InternalParsingErrors> {
  return result<playbook.Operation>({
    request: parseRequestStageContent(file, operation.request, operation.operationId),
    operationId: value(operation.operationId),
    before: parseArray(file, operation.before || [], parseRequestStage),
    after: parseArray(file, operation.after || [], parseRequestStage),
    authorizationTests: value(operation.authorizationTests || []),
    scenarios: parseArray(file, operation.scenarios || [], parseScenario),
    customTests: value(operation.customTests),
    customized: value(isOperationCustomized(operation)),
  });
}

function isOperationCustomized(operation: scan.Operation): boolean {
  const requestsFromFirstScenario = operation.scenarios?.[0]?.requests;
  const firstStageFromFirstScenario = requestsFromFirstScenario?.[0];

  const hasCustomTests = operation.customTests && operation.customTests.length > 0;
  const hasAuthorizationTests =
    operation.authorizationTests && operation.authorizationTests.length > 0;
  const hasBefore = operation.before && operation.before.length > 0;
  const hasAfter = operation.after && operation.after.length > 0;
  const hasMultipleScenarios = operation.scenarios && operation.scenarios.length > 1;
  const hasMoreThanOneRequestInFirstScenario =
    requestsFromFirstScenario && requestsFromFirstScenario.length > 1;
  const isFirstStageCustomized =
    firstStageFromFirstScenario !== undefined && isStageCustomized(firstStageFromFirstScenario);

  return (
    hasCustomTests ||
    hasAuthorizationTests ||
    hasBefore ||
    hasAfter ||
    hasMultipleScenarios ||
    hasMoreThanOneRequestInFirstScenario ||
    isFirstStageCustomized
  );
}

function isStageCustomized(stage: scan.RequestStageContent | scan.RequestStageReference) {
  const hasEnvironment = stage.environment && Object.keys(stage.environment).length > 0;
  const hasAuth = stage.auth && stage.auth.length > 0;
  const hasResponses = stage.responses && Object.keys(stage.responses).length > 0;
  const hasExpectedResponse = "expectedResponse" in stage;

  return hasEnvironment || hasAuth || hasResponses || hasExpectedResponse;
}

function parseRequestStage(
  file: scan.ConfigurationFileBundle,
  entry: scan.RequestStageContent | scan.RequestStageReference
): Result<playbook.Stage, InternalParsingErrors> {
  if (entry.$ref !== undefined) {
    // scanconf schema has "[k: string]: unknown;" makin $ref unusable to infer type, TODO fix schema
    return parseRequestStageReference(file, entry as scan.RequestStageReference);
  } else {
    return parseRequestStageContent(file, entry as scan.RequestStageContent);
  }
}

function parseRequestStageReference(
  file: scan.ConfigurationFileBundle,
  reference: scan.RequestStageReference
): Result<playbook.StageReference, InternalParsingErrors> {
  return result<playbook.StageReference>({
    responses: parseMap(file, reference.responses || {}, parseResponse),
    auth: value(reference.auth || []),
    ref: parseRequestRef(file, reference.$ref as string),
    fuzzing: value(reference.fuzzing),
    environment: parseCtxVariables(file, reference.environment || {}),
    injectionKey: value(reference.injectionKey),
    expectedResponse: value(reference.expectedResponse),
  });
}

function parseRequestStageContent(
  file: scan.ConfigurationFileBundle,
  content: scan.RequestStageContent,
  operationId?: string
): Result<playbook.StageContent, InternalParsingErrors> {
  return result<playbook.StageContent>({
    responses: parseMap(file, content.responses || {}, parseResponse),
    fuzzing: value(content.fuzzing),
    auth: value(content.auth || []),
    environment: parseCtxVariables(file, content.environment || {}),
    injectionKey: value(content.injectionKey),
    ref: value(undefined),
    defaultResponse: value(content.defaultResponse),
    request: parseRequestRequest(file, content.request, operationId),
    operationId: value(operationId),
  });
}

function parseRequestExternalStageContent(
  file: scan.ConfigurationFileBundle,
  content: scan.RequestStageContent
): Result<playbook.ExternalStageContent, InternalParsingErrors> {
  return result<playbook.ExternalStageContent>({
    operationId: [undefined, undefined],
    responses: parseMap(file, content.responses || {}, parseResponse),
    environment: parseCtxVariables(file, content.environment || {}),
    defaultResponse: value(content.defaultResponse),
    request: parseExternalRequestRequest(file, content.request),
  });
}

function parseRequestFile(
  file: scan.ConfigurationFileBundle,
  content: scan.RequestFile
): Result<playbook.StageContent | playbook.ExternalStageContent, InternalParsingErrors> {
  if (content.operationId === undefined) {
    return parseRequestExternalStageContent(file, content);
  } else {
    return parseRequestStageContent(file, content, content.operationId);
  }
}

function parseRequestRequest(
  file: scan.ConfigurationFileBundle,
  request: scan.CRequest | scan.HttpRequest,
  operationId?: string
): Result<playbook.CRequest, InternalParsingErrors> {
  // FIXME check that operationId is the same as request.operationId
  if (request.type === "42c") {
    return parseCRequest(file, request, operationId);
  }
  return makeErrorResult(`unknown request type: ${request.type}`);
}

function parseExternalRequestRequest(
  file: scan.ConfigurationFileBundle,
  request: scan.CRequest | scan.HttpRequest
): Result<playbook.ExternalCRequest, InternalParsingErrors> {
  if (request.type === "42c") {
    return parseExternalCRequest(file, request);
  }
  return makeErrorResult(`unknown request type: ${request.type}`);
}

function parseCRequest(
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

  // const operation = getOperationById(effectiveOperationId);

  // if (operation === undefined) {
  //   return makeErrorResult(
  //     `Unable to find in the OpenAPI file an operation with operationId: "${effectiveOperationId}"`
  //   );
  // }

  return result<playbook.CRequest>({
    operationId: value(effectiveOperationId),
    path: value("fooPath"),
    method: value("fooMethod".toLowerCase()),
    parameters: parseParameters(file, request?.details || {}),
    body: parseRequestBody(file, request?.details?.requestBody),
  });
}

function parseExternalCRequest(
  file: scan.ConfigurationFileBundle,
  request: scan.CRequest
): Result<playbook.ExternalCRequest, InternalParsingErrors> {
  return result<playbook.ExternalCRequest>({
    url: value(request.details.url),
    method: value(request.details.method.toLowerCase()),
    parameters: parseParameters(file, request?.details || {}),
    body: parseRequestBody(file, request?.details?.requestBody),
  });
}

function parseRequestBody(
  file: scan.ConfigurationFileBundle,
  body: scan.CRequest["details"]["requestBody"]
): NullableResult<playbook.OperationBody | undefined, InternalParsingErrors> {
  if (body === undefined || body === null) {
    return [undefined, undefined];
  }

  if (body.mode === "json") {
    return [{ mediaType: "application/json", value: body.json }, undefined];
  } else if (body.mode === "urlencoded") {
    return [
      { mediaType: "application/x-www-form-urlencoded", value: parseUrlencoded(body.urlencoded) },
      undefined,
    ];
  } else if (body.mode === "raw") {
    return [{ mediaType: "raw", value: body.raw }, undefined];
  }

  return [undefined, undefined];
}

function parseUrlencoded(
  urlencoded: Record<string, scan.UrlencodedObject>
): Record<string, unknown> {
  return Object.entries(urlencoded).reduce((acc, [key, value]) => {
    acc[key] = value.value;
    return acc;
  }, {} as Record<string, unknown>);
}

function parseParameters(
  file: scan.ConfigurationFileBundle,
  entry: scan.CRequest["details"]
): Result<playbook.ParameterValues, InternalParsingErrors> {
  return result<playbook.ParameterValues>({
    cookie: parseParametersArray(file, entry.cookies || []),
    path: parseParametersArray(file, entry.paths || []),
    query: parseParametersArray(file, entry.queries || []),
    header: parseParametersArray(file, entry.headers || []),
  });
}

function parseParametersArray(
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
  file: scan.ConfigurationFileBundle,
  entry: scan.Response
): Result<playbook.Response, InternalParsingErrors> {
  return result<playbook.Response>({
    expectations: value(entry.expectations),
    variableAssignments: parseMap(file, entry.variableAssignments || {}, parseVariableAssigmment),
  });
}

function parseVariableAssigmment(
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
    (assignment.in === "header" ||
      assignment.in === "query" ||
      assignment.in === "cookie" ||
      assignment.in === "path") &&
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
  file: scan.ConfigurationFileBundle,
  entry: scan.CtxVariables
): Result<playbook.OperationEnvironment, InternalParsingErrors> {
  return [entry, undefined];
}

function parseRequestRef(
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
    return [{ type: "request", id: String(path[1]) }, undefined];
  } else if (path.length === 3 && path[0] === "operations" && path[2] === "request") {
    return [{ type: "operation", id: String(path[1]) }, undefined];
  }

  return makeErrorResult(`unexpected stage $ref, must point to operations or requests: ${ref}`);
}

function parseCredentials(
  file: scan.ConfigurationFileBundle,
  credential: Record<string, scan.Credential> | { $ref: string }
): Result<playbook.Credentials, InternalParsingErrors> {
  if (credential["$ref"] !== undefined) {
    return makeErrorResult(`external credential refs are not supported: ${credential["$ref"]}`);
  }

  return parseMap(file, credential as Record<string, scan.Credential>, parseCredential);
}

function parseCredential(
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
    methods: parseMap(file, credential.credentials || {}, parseCredentialContent),
    description: value(credential.description),
  });
}

function parseCredentialContent(
  file: scan.ConfigurationFileBundle,
  credential: scan.CredentialContent
): Result<playbook.CredentialMethod, InternalParsingErrors> {
  return result<playbook.CredentialMethod>({
    description: value(credential.description),
    requests: parseArray(file, credential.requests || [], parseRequestStage),
    credential: value(credential.credential),
  });
}

function parseScenario(
  file: scan.ConfigurationFileBundle,
  scenario: scan.HappyPathScenario | scan.UnhappyPathScenario
): Result<playbook.Scenario, InternalParsingErrors> {
  return result<playbook.Scenario>({
    requests: parseArray(file, scenario.requests || [], parseRequestStage),
    key: value(scenario.key),
    fuzzing: value((scenario as scan.HappyPathScenario).fuzzing),
  });
}

function parseAuthenticationSwappingTest(
  file: scan.ConfigurationFileBundle,
  test: scan.AuthenticationSwappingTest
): Result<playbook.AuthenticationSwappingTest, InternalParsingErrors> {
  const source = test.source === null ? [] : test.source;
  const target = test.target === null ? [] : test.target;

  if (
    source.some((auth) => typeof auth !== "string") ||
    target.some((auth) => typeof auth !== "string")
  ) {
    return makeErrorResult(
      "only strings are allowed, embedding Credential objects is not supported yet"
    );
  }

  return result<playbook.AuthenticationSwappingTest>({
    key: value(test.key),
    source: value(source),
    target: value(target),
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
  file: scan.ConfigurationFileBundle,
  input: Record<string, I>,
  transform: (file: scan.ConfigurationFileBundle, entry: I) => Result<O, InternalParsingErrors>
): Result<Record<string, O>, InternalParsingErrors> {
  const errors: InternalParsingErrors = [];
  const map: Record<string, O> = {};

  const transformed: [string, Result<O, InternalParsingErrors>][] = Object.entries(input).map(
    ([key, value]) => [key, transform(file, value)]
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
  file: scan.ConfigurationFileBundle,
  input: I[],
  transform: (file: scan.ConfigurationFileBundle, entry: I) => Result<O, InternalParsingErrors>
): Result<O[], InternalParsingErrors> {
  const errors: InternalParsingErrors = [];
  const array: O[] = [];

  const transformed: Result<O, InternalParsingErrors>[] = (input || []).map((value) =>
    transform(file, value)
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
