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
import { Action } from "@reduxjs/toolkit";

export async function testPlaybook(
  client: HttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  envenv: EnvData,
  extraEnv: PlaybookEnvStack = [],
  suite: TestSuite,
  config: SuiteConfiguration,
  dispatch: (action: Action) => void,
  addTestExecutionAction: (action: { testId: string }) => Action,
  addStepExecutionAction: (action: {
    stageId: string;
    testId: string;
    step: PlaybookExecutorStep | HookExecutorStep;
  }) => Action
) {
  const cache = createAuthCache();
  const env: PlaybookEnvStack = [getExternalEnvironment(file, envenv, { schemes: {} })];
  //const result: PlaybookEnvStack = [];

  // Run all tests in the suite
  for (const test of suite.tests) {
    for (const { id, stages } of test.run(config.tests[test.id])) {
      dispatch(addTestExecutionAction({ testId: test.id }));
      for await (const step of executePlaybook(
        id,
        cache,
        client,
        oas,
        server,
        file,
        stages(),
        [...env, ...extraEnv],
        0
      )) {
        dispatch(addStepExecutionAction({ testId: test.id, stageId: id, step }));
      }
    }
  }
}
