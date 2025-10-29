import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Vault } from "@xliic/common/vault";

import basic from "./basic";
import apiKey from "./api-key";

const suites = { basic, "api-key": apiKey };

export type TestCheckResult = {
  failures: string[];
};

export type TestSuitCheckResult = {
  failures: Record<string, string[]>;
  tests: Record<string, TestCheckResult>;
};

export type CheckResult = Record<string, TestSuitCheckResult>;

export function check(spec: BundledSwaggerOrOasSpec, vault: Vault) {
  const result: CheckResult = {};
  for (const [id, suite] of Object.entries(suites)) {
    const suiteResult: TestSuitCheckResult = { failures: {}, tests: {} };
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

function noSuiteLevelFailures(suiteResult: TestSuitCheckResult): boolean {
  for (const failures of Object.values(suiteResult.failures)) {
    if (failures.length > 0) {
      return false;
    }
  }
  return true;
}
