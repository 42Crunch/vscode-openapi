import { HttpClient, HttpRequest } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { EnvData, SimpleEnvironment } from "@xliic/common/env";
import * as playbook from "@xliic/common/playbook";
import { Result } from "@xliic/common/result";

import { replaceEnv, replaceEnvVariables } from "./replace";
import { makeExternalHttpRequest, makeHttpRequest } from "./http";
import { PlaybookExecutorStep } from "./playbook";
import { assignVariables } from "./variable-assignments";
import { PlaybookEnv, PlaybookEnvStack, PlaybookVariableAssignments } from "./playbook-env";
import { MockHttpClient } from "./mock-http";

export async function* executeAllPlaybooks(
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: playbook.PlaybookBundle,
  envenv: EnvData,
  env: PlaybookEnvStack,
  playbooks: [string, playbook.Stage[]][]
): AsyncGenerator<PlaybookExecutorStep> {
  const result: PlaybookEnvStack = [];

  const environmentName = file.runtimeConfiguration?.environment || "default";
  const environment = file?.environments?.[environmentName];

  const [ee, eeError] =
    environment !== undefined
      ? makeEnvEnv(environment, envenv)
      : [
          [{ id: "empty", env: {}, assignments: [] }, {}] as [PlaybookEnv, SimpleEnvironment],
          undefined,
        ];

  if (eeError !== undefined) {
    console.log("error eeerrorr", eeError, envenv);
    return; // FIXME emit error
  }

  for (const [name, requests] of playbooks) {
    const playbookResult: PlaybookEnvStack = yield* executePlaybook(
      name,
      client,
      oas,
      server,
      file,
      requests,
      [ee[0], ...env, ...result]
    );

    if (playbookResult !== undefined) {
      result.push(...playbookResult);
    }
  }

  return result;
}

async function* executePlaybook(
  name: string,
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: playbook.PlaybookBundle,
  requests: playbook.Stage[],
  env: PlaybookEnvStack
): AsyncGenerator<PlaybookExecutorStep> {
  const result: PlaybookEnvStack = [];

  yield { event: "playbook-started", name: name as any };

  for (let i = 0; i < requests.length; i++) {
    const step = requests[i];

    if (step.ref === undefined) {
      yield {
        event: "http-request-prepare-error",
        error: "non-reference requests are not supported",
      };
      return;
    }

    const request =
      step.ref.type === "operation"
        ? file.operations[step.ref.id].request
        : file.requests?.[step.ref.id];

    yield { event: "request-started", ref: step.ref };

    if (request === undefined) {
      return; // FIXME error request not found
    }

    //const operation = file.operations[step.operationId];

    // skip auth for external requests
    const auth = request.operationId === undefined ? undefined : request.auth;
    const security: playbook.Credentials = yield* executeAuth(client, oas, server, file, auth, [
      ...env,
      ...result,
    ]);

    console.log("exec security", security);

    const replacedStageEnv = replaceEnvVariables(step.environment || {}, [...env, ...result]);

    const stageEnv: PlaybookEnv = {
      id: "stage-environment",
      env: replacedStageEnv.value,
      // FIXME can we make replaceEnvVariables return assignments?
      assignments: [],
    };

    const requestEnvStack: PlaybookEnvStack = [...env, ...result, stageEnv];

    const replacedRequestEnv = replaceEnvVariables(request.environment || {}, requestEnvStack);

    const requestEnv: PlaybookEnv = {
      id: "request-environment",
      env: replacedRequestEnv.value,
      assignments: [],
    };

    const replacements = replaceEnvVariables(request, [...env, ...result, requestEnv, stageEnv]);

    yield {
      event: "payload-variables-substituted",
      stack: requestEnvStack,
      found: [...replacedRequestEnv.found, ...replacedStageEnv.found, ...replacements.found],
      missing: [
        ...replacedRequestEnv.missing,
        ...replacedStageEnv.missing,
        ...replacements.missing,
      ],
    };

    // TODO fail in case if failed to replace variables

    const [httpRequest, requestError] =
      replacements.value.operationId === undefined
        ? await makeExternalHttpRequest(replacements.value.request)
        : await makeHttpRequest(
            oas,
            server,
            request.operationId,
            replacements.value.request,
            security
          );

    if (requestError !== undefined) {
      yield { event: "http-request-prepare-error", error: requestError };
      return;
    }

    yield {
      event: "http-request-prepared",
      request: httpRequest,
      operationId: request.operationId,
    };

    const [response, error2] = await client(httpRequest);

    if (error2 !== undefined) {
      yield { event: "http-error-received", error: error2 };
      return;
    }

    yield { event: "http-response-received", response };

    const [requestAssignments, requestAssignmentsError] = assignVariables(
      `playbook-${name}-step-${i}-request`,
      request.responses,
      httpRequest,
      response
    );

    if (requestAssignmentsError !== undefined) {
      yield {
        event: "variables-assignment-error",
        error: requestAssignmentsError,
      };
      return;
    }

    result.push(...requestAssignments);

    yield { event: "variables-assigned", assignments: requestAssignments };

    const [stepAssignments, stepAssignmentsError] = assignVariables(
      `playbook-${name}-step-${i}`,
      step.responses,
      httpRequest,
      response
    );

    if (stepAssignmentsError !== undefined) {
      yield { event: "http-error-received", error: stepAssignmentsError as any }; // FIXME use some general error
      return;
    }

    yield { event: "variables-assigned", assignments: stepAssignments };
    result.push(...stepAssignments);
  }

  yield { event: "playbook-finished" };

  return result;
}

async function* executeAuth(
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: playbook.PlaybookBundle,
  auth: string[] | undefined,
  env: PlaybookEnvStack
): AsyncGenerator<PlaybookExecutorStep> {
  const result: playbook.Credentials = {};
  if (auth === undefined) {
    return result;
  }

  for (const authName of auth) {
    yield { event: "auth-started", name: authName };
    const credential = file.authenticationDetails[0][authName]; // FIXME better error handling
    console.log("auth, processing credential", credential);
    const value = yield* executeGetCredentialValue(client, oas, server, file, credential, env);
    result[authName] = value;
    yield { event: "auth-finished" };
  }

  console.log("a re", result);

  return result;
}

async function* executeGetCredentialValue(
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: playbook.PlaybookBundle,
  credential: playbook.Credential,
  env: PlaybookEnvStack
): AsyncGenerator<PlaybookExecutorStep> {
  const method = credential.methods[credential.default];

  let result: PlaybookEnvStack = [];

  if (method.requests !== undefined) {
    result = yield* executePlaybook("auth", client, oas, server, file, method.requests, env);
  }

  if (result) {
    // FIXME -- report that the variables have been replaced
    const replacements = replaceEnv(method.credential, [...env, ...result]);
    console.log("auth replacements", replacements);
    if (replacements.missing.length !== 0) {
      // something is not found, err
    }
    console.log("here here", replacements.value);
    return replacements.value;
  } else {
    // err?
  }
}

export function makeEnvEnv(
  environment: playbook.PlaybookEnvironment,
  env: EnvData
): Result<[PlaybookEnv, SimpleEnvironment], string[]> {
  const result: playbook.Environment = {};
  const envEnv: SimpleEnvironment = {};
  const missing = [];
  for (const [name, variable] of Object.entries(environment.variables)) {
    if (env.secrets.hasOwnProperty(variable.name)) {
      result[name] = env.secrets[variable.name];
      envEnv[variable.name] = env.secrets[variable.name];
    } else if (env.default.hasOwnProperty(variable.name)) {
      result[name] = env.default[variable.name];
      envEnv[variable.name] = env.default[variable.name];
    } else if (!variable.required && variable.default !== undefined) {
      // required variables must always come from the environment, no default
      // values is used for these
      result[name] = variable.default;
    } else if (variable.required) {
      missing.push(variable.name);
    }
  }

  if (missing.length > 0) {
    return [undefined, missing];
  }

  return [[{ id: "environment", assignments: [], env: result }, envEnv], undefined];
}
