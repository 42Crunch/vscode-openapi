import { Action } from "@reduxjs/toolkit";

import { Playbook } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";
import { EnvData } from "@xliic/common/env";
import { HttpClient } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";

import { PlaybookExecutorStep } from "../playbook/playbook";
import { PlaybookEnvStack } from "../playbook/playbook-env";
import { createAuthCache } from "../playbook/auth-cache";
import { executePlaybook, getExternalEnvironment } from "../playbook/execute";
import { SuiteConfig, Suite, TestIssue } from "./types";
import { b } from "vitest/dist/chunks/suite.d.FvehnV49";

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
  addStepExecutionAction: (action: {
    stageId: string;
    testId: string;
    step: PlaybookExecutorStep;
  }) => Action
): Promise<TestIssue[]> {
  const result = [];

  const cache = createAuthCache();
  const env: PlaybookEnvStack = [getExternalEnvironment(file, envenv)];
  //const result: PlaybookEnvStack = [];

  const [tests, suiteFailures] = config;

  // Skip if suite has failures
  if (suiteFailures) {
    return [];
  }

  // Run all tests in the suite
  for (const [testId, test] of Object.entries(suite.tests)) {
    const [testConfig, testFailures] = tests![testId];
    // Skip tests that are not ready
    if (testFailures) {
      continue;
    }

    const stageGenerator = test.run(testConfig!, oas, file, vault);
    let stepGenerator = await stageGenerator.next();

    while (!stepGenerator.done) {
      const { id, steps, envStack } = stepGenerator.value;

      // Execute the playbook and collect the return value
      const playbookExecutor = executePlaybook(
        id,
        cache,
        client,
        oas,
        server,
        file,
        steps,
        [...env, ...extraEnv, ...(envStack || [])],
        vault,
        0
      );

      let playbookStep = await playbookExecutor.next();
      while (!playbookStep.done) {
        dispatch(
          addStepExecutionAction({
            testId,
            stageId: id,
            step: playbookStep.value as PlaybookExecutorStep,
          })
        );
        playbookStep = await playbookExecutor.next();
      }

      const [finalStep, finalStepError] = playbookStep.value;

      if (finalStepError) {
        // Playbook execution failed - log and break
        console.error(
          `Playbook execution failed for test: ${testId}, stage: ${id}, error: ${finalStepError}`
        );
        break;
      }

      result.push(...finalStep.result);

      // Pass the return value (Result<PlaybookEnvStack, PlaybookError>) to the next test stage
      stepGenerator = await stageGenerator.next(playbookStep.value);
    }
  }

  return result;
}
