import { EnvData, SimpleEnvironment } from "@xliic/common/env";
import { HttpClient } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec, getOperationById, getHttpResponseRange } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { makeExternalHttpRequest, makeHttpRequest } from "./http";
import { MockHttpClient, MockHttpResponse } from "../http-client/mock-client";
import { AuthResult, PlaybookExecutorStep } from "./playbook";
import { PlaybookEnv, PlaybookEnvStack } from "./playbook-env";
import { assignVariables, failedAssigments } from "./variable-assignments";
import {
  getMissingVariableNames,
  replaceCredentialVariables,
  replaceEnvironmentVariables,
  replaceRequestVariables,
} from "./variables";
import { createAuthCache, getAuthEntry, setAuthEntry, AuthCache } from "./auth-cache";
import { TestStep, Hooks } from "./playbook-tests";
import { Vault } from "@xliic/common/vault";

export type StageGenerator = AsyncGenerator<{ stage: Playbook.Stage; hooks: Hooks }, void>;

export type DynamicRequestList = StageGenerator;
export type StaticRequestList = Playbook.Stage[];

export type PlaybookList = {
  name: string;
  requests: StaticRequestList;
}[];

export async function* executeAllPlaybooks(
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  playbooks: PlaybookList,
  envenv: EnvData,
  extraEnv: PlaybookEnvStack = [],
  vault: Vault
): AsyncGenerator<PlaybookExecutorStep> {
  const cache = createAuthCache();
  const env: PlaybookEnvStack = [getExternalEnvironment(file, envenv)];
  const result: PlaybookEnvStack = [];
  for (const { name, requests } of playbooks) {
    const playbookResult: PlaybookEnvStack | undefined = yield* executePlaybook(
      name,
      cache,
      client,
      oas,
      server,
      file,
      requests,
      [...env, ...extraEnv, ...result],
      vault,
      0
    );

    if (playbookResult === undefined) {
      // playbook failed, bail
      break;
    } else {
      result.push(...playbookResult);
    }
  }

  return result;
}

export async function* executePlaybook<T extends StaticRequestList | DynamicRequestList>(
  name: string,
  cache: AuthCache,
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  requests: T,
  env: PlaybookEnvStack,
  vault: Vault,
  depth: number
): AsyncGenerator<
  T extends StaticRequestList ? PlaybookExecutorStep : PlaybookExecutorStep | TestStep,
  PlaybookEnvStack | undefined
> {
  const result: PlaybookEnvStack = [];

  yield { event: "playbook-started", name };

  if (depth >= 5) {
    yield {
      event: "playbook-aborted",
      error: "Maximum playbook execution depth is reached",
    };
    return;
  }

  const steps = iteratePlaybook(requests);

  let stepId = 0;
  let step = await steps.next();

  while (!step.done) {
    const { stage, hooks } = step.value;
    if (stage.ref === undefined) {
      yield {
        event: "playbook-aborted",
        error: "non-reference requests are not supported",
      };
      return;
    }

    const request = getRequestByRef(file, stage.ref);

    if (request === undefined) {
      yield {
        event: "playbook-aborted",
        error: `request not found: ${stage.ref.type}/${stage.ref.id}`,
      };
      return;
    }

    yield { event: "request-started", ref: stage.ref };

    // skip auth for external requests
    const auth = request.operationId === undefined ? undefined : request.auth;
    const security = yield* executeAuth(
      cache,
      client,
      oas,
      server,
      file,
      auth,
      [...env, ...result],
      vault,
      depth
    );

    if (security === undefined) {
      yield {
        event: "http-request-prepare-error",
        error: `Failed to retrieve credentials`,
      };
      return;
    }

    let hookedSecurity = security;
    if (hooks.security !== undefined) {
      hookedSecurity = yield* hooks.security(security) as any;
    }

    const replacedStageEnv = replaceEnvironmentVariables(
      "stage-environment",
      stage.environment || {},
      [...env, ...result]
    );

    const stageEnv: PlaybookEnv = {
      id: { type: "stage-environment" },
      env: replacedStageEnv.value,
      // FIXME can we make replaceEnvVariables return assignments?
      assignments: [],
    };

    const requestEnvStack: PlaybookEnvStack = [...env, ...result, stageEnv];

    const replacedRequestEnv = replaceEnvironmentVariables(
      "request-environment",
      request.environment || {},
      requestEnvStack
    );

    const requestEnv: PlaybookEnv = {
      id: { type: "request-environment" },
      env: replacedRequestEnv.value,
      assignments: [],
    };

    const operation =
      request.operationId !== undefined
        ? getOperationById(oas, request.operationId)?.operation
        : undefined;

    const replacements = replaceRequestVariables(oas, request.request, operation, [
      ...env,
      ...result,
      requestEnv,
      stageEnv,
    ]);

    const missing = [
      ...replacedRequestEnv.missing,
      ...replacedStageEnv.missing,
      ...replacements.missing,
    ];

    yield {
      event: "payload-variables-substituted",
      stack: [...requestEnvStack, requestEnv],
      found: [...replacedRequestEnv.found, ...replacedStageEnv.found, ...replacements.found],
      missing,
    };

    if (missing.length > 0) {
      yield {
        event: "http-request-prepare-error",
        error: `failed to replace request variables: ${getMissingVariableNames(missing)}`,
      };
      return;
    }

    const [httpRequest, requestError] =
      "operationId" in replacements.value
        ? await makeHttpRequest(
            oas,
            server,
            request.operationId,
            replacements.value,
            hookedSecurity
          )
        : await makeExternalHttpRequest(replacements.value);

    if (requestError !== undefined) {
      yield { event: "http-request-prepare-error", error: requestError };
      return;
    }

    let hookedRequest = httpRequest;
    if (hooks.request !== undefined) {
      hookedRequest = yield* hooks.request(httpRequest) as any;
    }

    if ("operationId" in replacements.value) {
      yield {
        event: "http-request-prepared",
        request: hookedRequest,
        operationId: request.operationId!,
        playbookRequest: replacements.value,
        auth: hookedSecurity,
      };
    } else {
      yield {
        event: "external-http-request-prepared",
        request: hookedRequest,
        playbookRequest: replacements.value,
        auth: hookedSecurity,
      };
    }

    const [response, error2] = await client(hookedRequest);

    if (error2 !== undefined) {
      let hookedError2 = error2;
      if (hooks.error !== undefined) {
        hookedError2 = yield* hooks.error(error2) as any;
      }
      yield { event: "http-error-received", error: hookedError2 };
      return;
    }

    let hookedResponse = response;
    if (hooks.response !== undefined) {
      hookedResponse = yield* hooks.response(response) as any;
    }

    yield { event: "http-response-received", response: hookedResponse };

    if (hookedResponse !== MockHttpResponse) {
      if (stage.expectedResponse !== undefined) {
        if (
          String(hookedResponse?.statusCode) !== stage.expectedResponse &&
          getHttpResponseRange(hookedResponse!.statusCode) !== stage.expectedResponse &&
          request.defaultResponse !== "default"
        ) {
          yield {
            event: "response-processing-error",
            error: `HTTP response code "${hookedResponse?.statusCode}" does not match expected stage response code "${stage.expectedResponse}"`,
          };
          return;
        }
      } else {
        if (
          String(hookedResponse?.statusCode) !== request.defaultResponse &&
          getHttpResponseRange(hookedResponse!.statusCode) !== request.defaultResponse &&
          request.defaultResponse !== "default"
        ) {
          yield {
            event: "response-processing-error",
            error: `HTTP response code "${hookedResponse?.statusCode}" does not match default response code "${request.defaultResponse}"`,
          };
          return;
        }
      }
    }

    const [requestAssignments, requestAssignmentsError] = assignVariables(
      { type: "playbook-request", name, step: stepId, responseCode: "default" },
      request.responses,
      httpRequest,
      hookedResponse,
      replacements.value.parameters
    );

    if (requestAssignmentsError !== undefined) {
      yield {
        event: "response-processing-error",
        error: requestAssignmentsError,
      };
      return;
    }

    result.push(...requestAssignments);

    yield { event: "variables-assigned", assignments: requestAssignments };

    const requestFailedAssignments = failedAssigments(requestAssignments);
    if (requestFailedAssignments.length > 0) {
      yield {
        event: "response-processing-error",
        error: `Response processing failed, can't assign variables: ${requestFailedAssignments
          .map((a) => a.name)
          .join(", ")}`,
      };
      return;
    }

    const [stepAssignments, stepAssignmentsError] = assignVariables(
      { type: "playbook-stage", name, step: stepId, responseCode: "default" },
      stage.responses,
      httpRequest,
      response,
      replacements.value.parameters
    );

    if (stepAssignmentsError !== undefined) {
      yield {
        event: "response-processing-error",
        error: stepAssignmentsError,
      };
      return;
    }

    yield { event: "variables-assigned", assignments: stepAssignments };

    const stepFailedAssignments = failedAssigments(stepAssignments);
    if (stepFailedAssignments.length > 0) {
      yield {
        event: "response-processing-error",
        error: `Response processing failed, can't assign variables: ${stepFailedAssignments
          .map((a) => a.name)
          .join(", ")}`,
      };
      return;
    }

    result.push(...stepAssignments);

    step = await steps.next();
    stepId++;
  }

  yield { event: "playbook-finished" };

  return result;
}

export async function* executeAuth(
  cache: AuthCache,
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  auth: string[] | undefined,
  env: PlaybookEnvStack,
  vault: Vault,
  depth: number
): AsyncGenerator<PlaybookExecutorStep, AuthResult | undefined> {
  const result: AuthResult = {};
  if (auth === undefined) {
    return result;
  }

  for (const authName of auth) {
    yield { event: "auth-started", name: authName };
    const [credentialName, methodName] = authName.split("/");
    const credential = file.authenticationDetails[0][credentialName];

    if (credential === undefined) {
      yield { event: "auth-aborted", error: `credential: "${credentialName}" is not found` };
      return;
    }

    const effectiveMethodName = methodName === undefined ? credential.default : methodName;

    const method = credential.methods[effectiveMethodName];

    if (method === undefined) {
      yield {
        event: "auth-aborted",
        error: `credential: "${credentialName}/${effectiveMethodName}" is not found`,
      };
      return;
    }

    if (credential === undefined) {
      yield { event: "auth-aborted", error: `credential: "${credentialName}" is not found` };
      return;
    }

    // check cache or get credential value
    const cached = getAuthEntry(cache, credential, effectiveMethodName);
    if (cached !== undefined) {
      yield {
        event: "credential-retrieved-from-cache",
        name: authName,
        result: cached,
      };
      result[authName] = { credential, value: cached };
    } else {
      const value: string | undefined = yield* executeGetCredentialValue(
        cache,
        client,
        oas,
        server,
        file,
        authName,
        credential,
        credentialName,
        method,
        env,
        vault,
        depth
      );

      if (value === undefined) {
        yield {
          event: "auth-aborted",
          error: `Failed to get value for the credential: "${credentialName}"`,
        };
        return;
      }

      setAuthEntry(cache, credential, effectiveMethodName, value);
      result[authName] = { credential, value };
    }

    yield { event: "auth-finished" };
  }

  return result;
}

async function* executeGetCredentialValue(
  cache: AuthCache,
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  authName: string,
  credential: Playbook.Credential,
  credentialName: string,
  method: Playbook.CredentialMethod,
  env: PlaybookEnvStack,
  vault: Vault,
  depth: number
): AsyncGenerator<PlaybookExecutorStep, string | undefined> {
  const credentialEnvStack = [...env];

  if (method.requests !== undefined) {
    const result = yield* executePlaybook(
      authName,
      cache,
      client,
      oas,
      server,
      file,
      method.requests,
      env,
      vault,
      depth + 1
    );

    if (result === undefined) {
      // failed to execute playbook, exiting
      return undefined;
    }

    credentialEnvStack.push(...result);
  }

  const replacements = replaceCredentialVariables(
    credential,
    credentialName,
    method.credential,
    vault,
    credentialEnvStack
  );

  if (replacements.missing.length !== 0) {
    // FIXME something is not found, err
  }

  yield {
    event: "credential-variables-substituted",
    name: authName,
    result: replacements.value as string,
    stack: credentialEnvStack,
    found: replacements.found,
    missing: replacements.missing,
  };

  return replacements.value;
}

export function makeEnvEnv(
  environment: Playbook.Environment,
  env: EnvData
): { environment: PlaybookEnv; simple: SimpleEnvironment; missing: string[] } {
  const result: Playbook.OperationEnvironment = {};
  const simple: SimpleEnvironment = {};
  const missing: string[] = [];
  for (const [name, variable] of Object.entries(environment.variables)) {
    if (variable.from === "hardcoded") {
      result[name] = variable.value;
    } else if (variable.from === "environment") {
      if (env.secrets.hasOwnProperty(variable.name)) {
        result[name] = env.secrets[variable.name];
        simple[variable.name] = env.secrets[variable.name];
      } else if (env.default.hasOwnProperty(variable.name)) {
        result[name] = env.default[variable.name];
        simple[variable.name] = env.default[variable.name];
      } else if (!variable.required && variable.default !== undefined) {
        result[name] = variable.default;
        // simple environment is for passing a substituted variables to binary or docker
        // in case if env parameter has a default value, there is no need to pass it
        // since it's available in the scan config file
        // additionally, it can be not just a string as in simple environment, but a complex object
      } else if (variable.required) {
        // required variables must always come from the environment, no default
        // values is used for these
        missing.push(variable.name);
      }
    }
  }

  return {
    environment: { id: { type: "global-environment" }, assignments: [], env: result },
    simple,
    missing,
  };
}

export function getExternalEnvironment(file: Playbook.Bundle, envenv: EnvData): PlaybookEnv {
  const environmentName = file.runtimeConfiguration?.environment || "default";
  const { environment } = makeEnvEnv(
    file?.environments?.[environmentName] || { variables: {} },
    envenv
  );
  return environment;
}

function getRequestByRef(file: Playbook.Bundle, ref: Playbook.RequestRef) {
  return ref.type === "operation" ? file.operations[ref.id]?.request : file.requests?.[ref.id];
}

async function* iteratePlaybook(requests: StaticRequestList | DynamicRequestList): StageGenerator {
  if (Symbol.asyncIterator in requests) {
    yield* requests;
  } else {
    for (const request of requests) {
      yield { stage: request, hooks: {} };
    }
  }
}
