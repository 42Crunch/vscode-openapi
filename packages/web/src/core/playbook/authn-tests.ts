import { EnvData } from "@xliic/common/env";
import { HttpClient } from "@xliic/common/http";
import {
  BundledSwaggerOrOasSpec,
  deref,
  getOperationById,
  isSwagger,
  OpenApi3,
  OpenApi30,
  OpenApi31,
  Swagger,
} from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { PlaybookExecutorStep, PlaybookHttpRequestPrepared } from "./playbook";
import { PlaybookEnvStack } from "./playbook-env";

import { createAuthCache } from "./auth-cache";
import { executePlaybook, getExternalEnvironment, PlaybookList } from "./execute";
import { makeHttpRequest } from "./http";

export async function* testPlaybook(
  target: [string, string],
  client: HttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  playbooks: PlaybookList,
  envenv: EnvData,
  extraEnv: PlaybookEnvStack = []
): AsyncGenerator<PlaybookExecutorStep> {
  const cache = createAuthCache();
  const env: PlaybookEnvStack = [getExternalEnvironment(file, envenv)];
  const result: PlaybookEnvStack = [];

  for (const { name, requests } of playbooks) {
    let playbookResult: PlaybookEnvStack | undefined = undefined;

    const playbookExecution = executePlaybook(
      name,
      cache,
      client,
      oas,
      server,
      file,
      requests,
      [...env, ...extraEnv, ...result],
      0
    );

    while (true) {
      const { value, done } = await playbookExecution.next();

      if (done) {
        playbookResult = value;
        break;
      } else {
        if (value.event === "http-request-prepared" && value.operationId === target[1]) {
          // Do something with the prepared request
          await executeAuthTests(client, oas, server, value);
        }

        yield value;
      }
    }

    if (playbookResult === undefined) {
      // playbook failed, bail
      break;
    } else {
      result.push(...playbookResult);
    }
  }

  return result;
}

async function executeAuthTests(
  client: HttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  event: PlaybookHttpRequestPrepared
) {
  // check operation auth

  const auth = getOperationAuth(oas, event.operationId);

  console.log("auth", auth);

  const [request, error] = await makeHttpRequest(
    oas,
    server,
    "userinfo",
    event.playbookRequest,
    {} //event.auth
  );

  if (error !== undefined) {
    console.error("Failed to create request:", error);
    return;
  }

  const [response, error2] = await client(request);

  console.log("Executing auth test with request:", request, response);
}

type OperationAuth = Record<
  string,
  | {
      type: "swagger";
      scheme: Swagger.SecurityScheme;
      scopes: string[];
    }
  | {
      type: "openapi3";
      scheme: OpenApi30.SecurityScheme | OpenApi31.SecurityScheme;
      scopes: string[];
    }
>;

function getOperationAuth(oas: BundledSwaggerOrOasSpec, operationId: string): OperationAuth[] {
  const requirements = getSecurityRequirements(oas, operationId);

  if (requirements === undefined) {
    return [];
  }

  return requirements.map((requirement) => {
    const result: OperationAuth = {};

    Object.entries(requirement).forEach(([name, scopes]) => {
      if (isSwagger(oas)) {
        const scheme = oas.securityDefinitions?.[name];
        result[name] = { type: "swagger", scheme: scheme!, scopes };
      } else {
        const scheme = deref<OpenApi30.SecurityScheme | OpenApi31.SecurityScheme>(
          oas,
          oas?.components?.securitySchemes?.[name]
        );
        result[name] = { type: "openapi3", scheme: scheme!, scopes };
      }
    });

    return result;
  });
}

function getSecurityRequirements(oas: BundledSwaggerOrOasSpec, operationId: string) {
  const result = getOperationById(oas, operationId);

  if (result === undefined) {
    return undefined;
  }

  const { operation } = result;

  if (operation.security !== undefined) {
    return operation.security;
  }

  if (oas.security !== undefined) {
    return oas.security;
  }
}
