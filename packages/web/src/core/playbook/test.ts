import { EnvData } from "@xliic/common/env";
import { HttpClient } from "@xliic/common/http";
import {
  BundledSwaggerOrOasSpec,
  deref,
  getOperationById,
  isSwagger,
  OpenApi30,
  OpenApi31,
  Swagger,
} from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { AuthResult, PlaybookExecutorStep, PlaybookHttpRequestPrepared } from "./playbook";
import { PlaybookEnvStack } from "./playbook-env";

import { createAuthCache } from "./auth-cache";
import { executePlaybook, getExternalEnvironment, PlaybookList } from "./execute";
import { makeHttpRequest } from "./http";
import { SuiteConfiguration, TestSuite } from "./identity-tests/types";

export async function* testPlaybook(
  client: HttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  envenv: EnvData,
  extraEnv: PlaybookEnvStack = [],
  suite: TestSuite,
  config: SuiteConfiguration
): AsyncGenerator<PlaybookExecutorStep> {
  const cache = createAuthCache();
  const env: PlaybookEnvStack = [getExternalEnvironment(file, envenv)];
  const result: PlaybookEnvStack = [];

  const test1 = suite.tests[0];

  const playbookResult: PlaybookEnvStack | undefined = yield* executePlaybook(
    "test1",
    cache,
    client,
    oas,
    server,
    file,
    [test1.foo(config.tests[test1.id])],
    [...env, ...extraEnv, ...result],
    0
  );

  if (playbookResult !== undefined) {
    result.push(...playbookResult);
  }

  return result;
}
