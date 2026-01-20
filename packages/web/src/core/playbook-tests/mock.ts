import { assert, expect } from "vitest";

import { Result } from "@xliic/result";
import { Playbook } from "@xliic/scanconf";
import { Scanconf, parse } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";

import { executeAllPlaybooks, PlaybookList, PlaybookError } from "../playbook/execute";
import { PlaybookExecutorStep } from "../playbook/playbook";
import { PlaybookEnv, PlaybookEnvStack } from "../playbook/playbook-env";
import { mockHttpClient } from "../http-client/mock-client";

export async function mockScenario(
  oas: any,
  file: Playbook.Bundle,
  operationId: string,
  vault: Vault
): Promise<{ steps: PlaybookExecutorStep[]; result: Result<PlaybookEnvStack, PlaybookError> }> {
  const client = mockHttpClient();

  const steps = [];
  const env: PlaybookEnvStack = [];

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
  }

  return { steps, result };
}
