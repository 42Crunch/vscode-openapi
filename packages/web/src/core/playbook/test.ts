import { Action } from "@reduxjs/toolkit";

import { Playbook } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";
import { EnvData } from "@xliic/common/env";
import { HttpClient } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";

import { PlaybookExecutorStep } from "./playbook";
import { PlaybookEnvStack } from "./playbook-env";
import { createAuthCache } from "./auth-cache";
import { executePlaybook, getExternalEnvironment } from "./execute";
import { SuiteConfig, Suite } from "./identity-tests/types";
import { TestStep } from "./playbook-tests";

export async function testPlaybook(
  client: HttpClient,
  oas: BundledSwaggerOrOasSpec,
  server: string,
  file: Playbook.Bundle,
  vault: Vault,
  envenv: EnvData,
  extraEnv: PlaybookEnvStack = [],
  suite: Suite,
  config: SuiteConfig,
  dispatch: (action: Action) => void,
  addTestExecutionAction: (action: { testId: string }) => Action,
  addStepExecutionAction: (action: {
    stageId: string;
    testId: string;
    step: PlaybookExecutorStep | TestStep;
  }) => Action
) {
  const cache = createAuthCache();
  const env: PlaybookEnvStack = [getExternalEnvironment(file, envenv)];
  //const result: PlaybookEnvStack = [];

  // Run all tests in the suite
  for (const [testId, test] of Object.entries(suite.tests)) {
    for (const { id, stages } of test.run(config.tests[testId], oas, file, vault)) {
      dispatch(addTestExecutionAction({ testId }));
      for await (const step of executePlaybook(
        id,
        cache,
        client,
        oas,
        server,
        file,
        stages(),
        [...env, ...extraEnv],
        vault,
        0
      )) {
        dispatch(addStepExecutionAction({ testId, stageId: id, step }));
      }
    }
  }
}
