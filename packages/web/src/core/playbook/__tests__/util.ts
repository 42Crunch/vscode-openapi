import { assert, expect } from "vitest";

import { Playbook } from "@xliic/scanconf";
import { Scanconf, parse } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";

import { executeAllPlaybooks, PlaybookList } from "../execute";
import { PlaybookExecutorStep } from "../playbook";
import { PlaybookEnv } from "../playbook-env";
import { httpClient } from "./httpclient";
import { Suite, SuiteConfig } from "../identity-tests/types";
import { testPlaybook } from "../test";
import { TestStep } from "../playbook-tests";

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

export async function runScenario(
  target: string,
  oas: any,
  file: Playbook.Bundle,
  name: string,
  vars?: PlaybookEnv,
  vault?: Vault
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
    [{ name: "test", requests: file.operations[name].scenarios[0].requests }],
    { default: {}, secrets: {} },
    env,
    vault ?? { schemes: {} }
  )) {
    steps.push(step);
  }

  return steps;
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

export async function runSuite(
  target: string,
  oas: any,
  file: Playbook.Bundle,
  suite: Suite,
  config: SuiteConfig,
  vars?: PlaybookEnv,
  vault?: Vault
): Promise<Array<PlaybookExecutorStep | TestStep>> {
  const steps: Array<PlaybookExecutorStep | TestStep> = [];
  const env = [];

  if (vars) {
    env.push(vars);
  }

  await testPlaybook(
    httpClient,
    oas,
    target,
    file,
    vault ?? { schemes: {} },
    { default: {}, secrets: {} },
    env,
    suite,
    config,
    // dispatch function - not used in tests
    () => {},
    // addTestExecutionAction - returns an Action
    (action) => ({ type: "test-started", payload: action }),
    // addStepExecutionAction - collect steps and return an Action
    (action) => {
      steps.push(action.step);
      return { type: "test-step", payload: action };
    }
  );

  return steps;
}
