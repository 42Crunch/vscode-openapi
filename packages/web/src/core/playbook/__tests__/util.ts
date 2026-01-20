import { assert, expect } from "vitest";

import { Result } from "@xliic/result";
import { Playbook } from "@xliic/scanconf";
import { Scanconf, parse } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";

import { executeAllPlaybooks, PlaybookList, PlaybookError } from "../execute";
import { PlaybookExecutorStep } from "../playbook";
import { PlaybookEnv, PlaybookEnvStack } from "../playbook-env";
import { httpClient } from "./httpclient";
import { mockHttpClient, MockHttpClient } from "../../http-client/mock-client";
import { HttpClient } from "@xliic/common/http";

export function makeStepAssert(steps: PlaybookExecutorStep[]) {
  return (obj: any) => expect(steps.shift()).toMatchObject(obj);
}

export function parseScenario(oas: any, scenario: Scanconf.ConfigurationFileBundle) {
  const [file, error] = parse(oas, scenario);

  if (error !== undefined) {
    assert.fail("Error parsing config: " + JSON.stringify(error));
  }

  return file;
}

export async function mockScenario(
  target: string,
  oas: any,
  file: Playbook.Bundle,
  name: string,
  vars?: PlaybookEnv,
  vault?: Vault
) {
  return runScenarioWithClient(mockHttpClient(), target, oas, file, name, vars, vault);
}

export async function runScenario(
  target: string,
  oas: any,
  file: Playbook.Bundle,
  name: string,
  vars?: PlaybookEnv,
  vault?: Vault
) {
  return runScenarioWithClient(httpClient, target, oas, file, name, vars, vault);
}

export async function runScenarioWithClient(
  client: HttpClient | MockHttpClient,
  target: string,
  oas: any,
  file: Playbook.Bundle,
  name: string,
  vars?: PlaybookEnv,
  vault?: Vault
): Promise<{ steps: PlaybookExecutorStep[]; result: Result<PlaybookEnvStack, PlaybookError> }> {
  const steps = [];
  const env: PlaybookEnvStack = [];

  if (vars) {
    env.push(vars);
  }

  const iterator = executeAllPlaybooks(
    client,
    oas,
    target,
    file,
    [{ name: "test", requests: file.operations[name].scenarios[0].requests }],
    { default: {}, secrets: {} },
    env,
    vault ?? { schemes: {} }
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

export async function runPlaybooks(
  target: string,
  oas: any,
  file: Playbook.Bundle,
  playbooks: PlaybookList,
  vars?: PlaybookEnv
): Promise<PlaybookExecutorStep[]> {
  const steps = [];
  const env = [];

  if (vars) {
    env.push(vars);
  }

  for await (const step of executeAllPlaybooks(
    httpClient,
    oas,
    target,
    file,
    playbooks,
    { default: {}, secrets: {} },
    env,
    { schemes: {} }
  )) {
    steps.push(step);
  }

  return steps;
}
