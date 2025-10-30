import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import basic from "./basic";
import apiKey from "./api-key";
import { SuiteConfiguration, Test, TestConfiguration } from "./types";

const suites = { basic, "api-key": apiKey };

export type Configuration = Record<string, SuiteConfiguration>;

export function configure(spec: BundledSwaggerOrOasSpec, vault: Vault) {
  const result: Configuration = {};
  for (const [id, suite] of Object.entries(suites)) {
    const suiteResult: SuiteConfiguration = { failures: {}, tests: {} };
    for (const [checkId, checker] of suite.requirements) {
      suiteResult.failures[checkId] = [];
      suiteResult.failures[checkId].push(...checker(spec, vault));
    }

    if (noSuiteLevelFailures(suiteResult)) {
      for (const test of suite.tests) {
        const testFailures = [];
        for (const [checkId, checker] of test.requirements) {
          testFailures.push(...checker(spec, vault));
        }
        suiteResult.tests[test.id] = { failures: testFailures };
      }
    }
    result[id] = suiteResult;
  }

  return result;
}

export function execute(
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault,
  test: Test,
  config: TestConfiguration
) {}

function noSuiteLevelFailures(suiteResult: SuiteConfiguration): boolean {
  for (const failures of Object.values(suiteResult.failures)) {
    if (failures.length > 0) {
      return false;
    }
  }
  return true;
}
