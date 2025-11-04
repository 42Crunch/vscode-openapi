import { EnvData } from "@xliic/common/env";
import { HttpClient } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { PlaybookExecutorStep } from "./playbook";
import { PlaybookEnvStack } from "./playbook-env";

import { createAuthCache } from "./auth-cache";
import { executePlaybook, getExternalEnvironment } from "./execute";
import { SuiteConfiguration, TestSuite } from "./identity-tests/types";
import { HookExecutorStep } from "./playbook-tests";

export async function* testPlaybook(
  client: HttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  envenv: EnvData,
  extraEnv: PlaybookEnvStack = [],
  suite: TestSuite,
  config: SuiteConfiguration
): AsyncGenerator<PlaybookExecutorStep | HookExecutorStep> {
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
    test1.foo(config.tests[test1.id]),
    [...env, ...extraEnv, ...result],
    0
  );

  if (playbookResult !== undefined) {
    result.push(...playbookResult);
  }

  return result;
}
