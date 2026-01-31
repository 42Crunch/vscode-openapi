import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import basic from "./basic";
import basicBola from "./basic-bola";
import basicSecurityRequirements from "./security-requirements";
import type { TestConfig, Suite, SuiteConfig, ConfigFailures } from "./types";
import { Playbook } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";
import { failure, Result, success } from "@xliic/result";

const suites = { basic, basicBola, basicSecurityRequirements } as const;

type Suites = typeof suites;
type SuiteId = keyof Suites;
type Configuration = {
  [K in SuiteId]: SuiteConfig;
};

export type { Suites, SuiteId, SuiteConfig, Configuration, TestConfig };
export { suites };

async function configureSuite<S extends Suite>(
  suite: S,
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): Promise<SuiteConfig> {
  // Call suite.configure() which checks suite-level requirements
  const [testsToRun, suiteFailures] = await suite.configure(spec, playbook, vault);

  if (suiteFailures) {
    return failure(suiteFailures);
  }

  // Configure each test
  const tests: Record<string, Result<TestConfig, ConfigFailures>> = {};
  for (const [key, test] of Object.entries(testsToRun!)) {
    tests[key] = await test.configure(spec, playbook, vault);
  }

  return success(tests);
}

export async function configure(
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): Promise<Configuration> {
  const result = {} as any;
  for (const id of Object.keys(suites) as Array<keyof Suites>) {
    result[id] = await configureSuite(suites[id], spec, playbook, vault);
  }
  return result;
}
