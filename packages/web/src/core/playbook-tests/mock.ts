import { Result } from "@xliic/result";
import { Playbook } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";

import { executeAllPlaybooks, PlaybookError } from "../playbook/execute";
import { PlaybookExecutorStep } from "../playbook/playbook";
import { PlaybookEnvStack, PlaybookLookupResult } from "../playbook/playbook-env";
import { mockHttpClient } from "../http-client/mock-client";

export type OperationVariables = {
  operationId: string;
  found: PlaybookLookupResult[];
};

export async function mockScenario(
  oas: any,
  file: Playbook.Bundle,
  operationId: string,
  vault: Vault
): Promise<{
  steps: PlaybookExecutorStep[];
  result: Result<PlaybookEnvStack, PlaybookError>;
  variables: OperationVariables[];
}> {
  const client = mockHttpClient();

  const steps: PlaybookExecutorStep[] = [];
  const env: PlaybookEnvStack = [];
  const state: StepProcessingState = {
    authStack: [],
    pendingOperationId: undefined,
    operations: [],
  };

  const iterator = executeAllPlaybooks(
    client,
    oas,
    "http://mock.localhost",
    file,
    [{ name: "test", requests: file.operations[operationId].scenarios[0].requests }],
    { default: {}, secrets: {} },
    env,
    vault
  );

  let result: Result<PlaybookEnvStack, PlaybookError>;
  while (true) {
    const { value, done } = await iterator.next();
    if (done) {
      result = value;
      break;
    }
    steps.push(value);
    processStep(state, value);
  }

  return { steps, result, variables: state.operations };
}

type StepProcessingState = {
  authStack: string[];
  pendingOperationId: string | undefined;
  operations: OperationVariables[];
};

function processStep(state: StepProcessingState, step: PlaybookExecutorStep): void {
  switch (step.event) {
    case "auth-started":
      state.authStack.push(step.name);
      break;
    case "auth-finished":
      state.authStack.pop();
      break;
    case "request-started":
      // Only track top-level operations (not auth playbooks)
      if (state.authStack.length === 0) {
        const ref = step.ref;
        if (ref?.type === "operation") {
          state.pendingOperationId = ref.id;
        }
      }
      break;
    case "payload-variables-substituted":
      // Only track top-level operations (not auth playbooks)
      if (state.authStack.length === 0 && state.pendingOperationId !== undefined) {
        state.operations.push({
          operationId: state.pendingOperationId,
          found: step.found,
        });
        state.pendingOperationId = undefined;
      }
      break;
  }
}
