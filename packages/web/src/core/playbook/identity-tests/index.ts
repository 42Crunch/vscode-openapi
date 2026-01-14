import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import basic from "./basic";
import basicBola from "./basic-bola";
import { TestConfig, Suite, SuiteConfig, ConfigFailures } from "./types";
import { Playbook } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";
import { failure, Result, success } from "@xliic/result";

const suites = { basic, basicBola } as const;

export type Suites = typeof suites;
export type SuiteId = keyof Suites;

export type Configuration = {
  [K in SuiteId]: SuiteConfig;
};

function configureSuite<S extends Suite>(
  suite: S,
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): SuiteConfig {
  // Call suite.configure() which checks suite-level requirements
  const [testsToRun, suiteFailures] = suite.configure(spec, playbook, vault);

  if (suiteFailures) {
    return failure(suiteFailures);
  }

  // Configure each test
  const tests: Record<string, Result<TestConfig, ConfigFailures>> = {};
  for (const [key, test] of Object.entries(testsToRun!)) {
    tests[key] = test.configure(spec, playbook, vault);
  }

  return success(tests);
}

export function configure(
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): Configuration {
  const result = {} as any;
  for (const id of Object.keys(suites) as Array<keyof Suites>) {
    result[id] = configureSuite(suites[id], spec, playbook, vault);
  }
  return result;
}
