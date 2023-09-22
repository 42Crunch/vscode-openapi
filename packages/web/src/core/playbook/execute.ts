import { HttpClient } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { EnvData } from "@xliic/common/env";
import * as playbook from "@xliic/common/playbook";
import { Result } from "@xliic/common/result";

import { replaceEnv, replaceEnvVariables } from "./replace";
import { makeHttpRequest } from "./http";
import { PlaybookExecutorStep } from "./playbook";
import { assignVariables } from "./variable-assignments";
import { PlaybookEnv, PlaybookEnvStack } from "./playbook-env";
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

  const name = Object.keys(file.environments)?.[0];
  const environment = file.environments[name];

  const [ee, eeError] = makeEnvEnv(environment, envenv);

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
      [ee, ...env, ...result]
    );
    result.push(...playbookResult);
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

    const security: playbook.Credentials = yield* executeAuth(
      client,
      oas,
      server,
      file,
      request.auth,
      [...env, ...result]
    );

    console.log("got security values", security, env);

    const replacedStageEnv = replaceEnvVariables(step.environment || {}, [...env, ...result]);

    const stageEnv: PlaybookEnv = {
      id: "stage-environment",
      env: replacedStageEnv.value,
      // FIXME can we make replaceEnvVariables return assignments?
      assignments: [],
    };

    console.log("me stage env", stageEnv);

    const replacedRequestEnv = replaceEnvVariables(request.environment || {}, [
      ...env,
      ...result,
      stageEnv,
    ]);

    const requestEnv: PlaybookEnv = {
      id: "request-environment",
      env: replacedRequestEnv.value,
      assignments: [],
    };

    const replacements = replaceEnvVariables(request, [...env, ...result, requestEnv, stageEnv]);

    yield {
      event: "payload-variables-substituted",
      found: [...replacedRequestEnv.found, ...replacedStageEnv.found, ...replacements.found],
      missing: [
        ...replacedRequestEnv.missing,
        ...replacedStageEnv.missing,
        ...replacements.missing,
      ],
    };

    // TODO fail in case if failed to replace variables

    const [httpRequest, requestError] = await makeHttpRequest(
      oas,
      server,
      request.request.operationId,
      replacements.value.request,
      security
    );

    if (requestError !== undefined) {
      yield { event: "http-request-prepare-error", error: requestError };
      return;
    }

    yield { event: "http-request-prepared", request: httpRequest };

    const [response, error2] = await client(httpRequest);

    console.log("me got response", response);

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
      yield { event: "http-error-received", error: requestAssignmentsError as any }; // FIXME use some general error
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
    const value = yield* executeGetCredentialValue(client, oas, server, file, credential, env);
    result[authName] = value;
    yield { event: "auth-finished" };
  }

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

  console.log("auth requests", method.requests);

  if (method.requests !== undefined) {
    result = yield* executePlaybook("auth", client, oas, server, file, method.requests, env);
  }

  if (result) {
    // FIXME -- report that the variables have been replaced
    const replacements = replaceEnv(method.credential, [...result, ...env]);
    if (replacements.missing.length !== 0) {
      // something is not found, err
    }
    return replacements.value;
  } else {
    // err?
  }
}

export function makeEnvEnv(
  environment: playbook.PlaybookEnvironment,
  env: EnvData
): Result<PlaybookEnv, string[]> {
  const result: playbook.Environment = {};
  const missing = [];
  for (const [name, variable] of Object.entries(environment.variables)) {
    console.log("checking for", variable.name);
    if (env.secrets.hasOwnProperty(variable.name)) {
      result[name] = env.secrets[variable.name];
    } else if (env.default.hasOwnProperty(variable.name)) {
      result[name] = env.default[variable.name];
    } else if (variable.default !== undefined) {
      result[name] = variable.default;
    } else if (variable.required) {
      missing.push(variable.name);
    }
  }

  if (missing.length > 0) {
    return [undefined, missing];
  }

  return [{ id: "start", assignments: [], env: result }, undefined];
}
