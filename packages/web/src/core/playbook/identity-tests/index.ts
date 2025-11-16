//import apiKey from "./api-key";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import basic from "./basic";
import { Test, TestConfig, Suite, SuiteConfig } from "./types";
import { Playbook } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";

const suites = { basic } as const;

export type Suites = typeof suites;
export type SuiteId = keyof Suites;

export type Configuration = {
  [K in SuiteId]: SuiteConfig;
};

/*

export type Configuration = Record<string, SuiteConfiguration>;

export function configure(spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) {
  const result: Configuration = {};
  for (const [id, suite] of Object.entries(suites)) {
    const suiteResult: SuiteConfiguration = { failures: {}, tests: {} };
    for (const [checkId, checker] of suite.requirements) {
      suiteResult.failures[checkId] = [];
      suiteResult.failures[checkId].push(...checker(spec, playbook, vault));
    }

    if (noSuiteLevelFailures(suiteResult)) {
      for (const [testId, test] of Object.entries(suite.tests)) {
        const testFailures = [];
        for (const [checkId, checker] of test.requirements) {
          testFailures.push(...checker(spec, playbook, vault));
        }
        const foo = test.configure(spec, playbook, vault);
        suiteResult.tests[testId] = { failures: testFailures };
      }
    }
    result[id] = suiteResult;
  }

  return result;
}

function noSuiteLevelFailures(suiteResult: SuiteConfiguration): boolean {
  for (const failures of Object.values(suiteResult.failures)) {
    if (failures.length > 0) {
      return false;
    }
  }
  return true;
}
*/

function configureSuite<S extends Suite>(
  suite: S,
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): SuiteConfig {
  const failures: Record<string, string> = {};
  for (const [checkId, checker] of Object.entries(suite.requirements)) {
    const failure = checker(spec, playbook, vault);
    if (failure) {
      failures[checkId] = failure;
    }
  }

  if (Object.keys(failures).length > 0) {
    return {
      ready: false,
      failures,
      tests: {},
    };
  }

  const tests: Record<string, TestConfig> = {};
  for (const key of Object.keys(suite.tests)) {
    tests[key] = configureTest(suite.tests[key], spec, playbook, vault);
  }

  return {
    ready: true,
    failures: {},
    tests,
  };
}

function configureTest<T extends Test<TestConfig>>(
  test: T,
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): TestConfig {
  const failures: Record<string, string> = {};
  for (const [checkId, checker] of Object.entries(test.requirements)) {
    const failure = checker(spec, playbook, vault);
    if (failure) {
      failures[checkId] = failure;
    }
  }

  if (Object.keys(failures).length > 0) {
    return {
      ready: false,
      failures,
    };
  }

  return test.configure(spec, playbook, vault);
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
