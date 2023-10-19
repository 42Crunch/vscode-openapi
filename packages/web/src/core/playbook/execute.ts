import { EnvData, SimpleEnvironment } from "@xliic/common/env";
import { HttpClient } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { makeExternalHttpRequest, makeHttpRequest } from "./http";
import { MockHttpClient } from "./mock-http";
import { AuthResult, PlaybookExecutorStep } from "./playbook";
import { PlaybookEnv, PlaybookEnvStack } from "./playbook-env";
import { assignVariables } from "./variable-assignments";
import { replaceEnv, replaceEnvVariables } from "./variables";

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
  const environment = file?.environments?.[environmentName] || { variables: {} };

  const { environment: playbookEnv } = makeEnvEnv(environment, envenv);

  for (const [name, requests] of playbooks) {
    const playbookResult: PlaybookEnvStack = yield* executePlaybook(
      name,
      client,
      oas,
      server,
      file,
      requests,
      [playbookEnv, ...env, ...result]
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
    const security: AuthResult = yield* executeAuth(client, oas, server, file, auth, [
      ...env,
      ...result,
    ]);

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
  const result: AuthResult = {};
  if (auth === undefined) {
    return result;
  }

  for (const authName of auth) {
    yield { event: "auth-started", name: authName };
    const [credentialName, methodName] = authName.split("/");
    const credential = file.authenticationDetails[0][credentialName]; // FIXME better error handling
    const method =
      methodName === undefined
        ? credential.methods[credential.default]
        : credential.methods[methodName];
    const value: string = yield* executeGetCredentialValue(
      client,
      oas,
      server,
      file,
      credentialName,
      method,
      env
    );
    result[authName] = { credential, value };
    yield { event: "auth-finished" };
  }

  return result;
}

async function* executeGetCredentialValue(
  client: HttpClient | MockHttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: playbook.PlaybookBundle,
  credentialName: string,
  method: playbook.CredentialMethod,
  env: PlaybookEnvStack
): AsyncGenerator<PlaybookExecutorStep> {
  let result: PlaybookEnvStack = [];

  if (method.requests !== undefined) {
    result = yield* executePlaybook(
      credentialName,
      client,
      oas,
      server,
      file,
      method.requests,
      env
    );
  }

  // FIXME what happens if we fail to execute credential requests[]?

  if (result) {
    const credentialEnvStack = [...env, ...result];

    const replacements = replaceEnv(method.credential, credentialEnvStack);
    if (replacements.missing.length !== 0) {
      // something is not found, err
    }

    yield {
      event: "credential-variables-substituted",
      stack: credentialEnvStack,
      found: replacements.found,
      missing: replacements.missing,
    };

    return replacements.value;
  } else {
    // err?
  }
}

export function makeEnvEnv(
  environment: playbook.PlaybookEnvironment,
  env: EnvData
): { environment: PlaybookEnv; simple: SimpleEnvironment; missing: string[] } {
  const result: playbook.Environment = {};
  const simple: SimpleEnvironment = {};
  const missing: string[] = [];
  console.log("make env env", environment);
  for (const [name, variable] of Object.entries(environment.variables)) {
    if (env.secrets.hasOwnProperty(variable.name)) {
      result[name] = env.secrets[variable.name];
      simple[variable.name] = env.secrets[variable.name];
    } else if (env.default.hasOwnProperty(variable.name)) {
      result[name] = env.default[variable.name];
      simple[variable.name] = env.default[variable.name];
    } else if (!variable.required && variable.default !== undefined) {
      // required variables must always come from the environment, no default
      // values is used for these
      result[name] = variable.default;
    } else if (variable.required) {
      missing.push(variable.name);
    }
  }

  return {
    environment: { id: "environment", assignments: [], env: result },
    simple,
    missing,
  };
}
