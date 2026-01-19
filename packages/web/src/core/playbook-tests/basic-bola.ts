import { BundledSwaggerOrOasSpec, getBasicSecuritySchemes } from "@xliic/openapi";
import { Result, success, failure } from "@xliic/result";
import { BasicCredential, Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, Suite, ConfigFailures, TestStageGenerator, TestIssue } from "./types";
import { hasValidBasicAuthCredentials, usesBasicAuth } from "./test-requirements";

type BasicTestConfig = TestConfig & {
  operationId: string[];
};

const basicBola: Test<BasicTestConfig> = {
  configure: function (
    oas: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): Result<BasicTestConfig, ConfigFailures> {
    const failed = hasValidBasicAuthCredentials(oas, playbook, vault);
    if (failed) {
      return failure({ hasValidBasicAuthCredentials: failed });
    }

    const schemes = getBasicSecuritySchemes(oas);
    // check if not empty, pick first one for now
    //const operations = selectOperationBySecurityScheme(oas, schemes[0]);

    // check if not empty, pick first one for now
    //const toTest = selectOperationsToTest(oas, operations);

    return success({ operationId: [] });
  },

  run: async function* (
    config: BasicTestConfig,
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ) {
    for (const operationId of config.operationId) {
      const operation = playbook.operations[operationId];
      // use first scenario for now
      const scenario = operation.scenarios?.[0];

      //   const [setupResult, setupError] = yield {
      //     id: `${operationId}-setup`,
      //     steps: setupScenario(playbook, vault, scenario),
      //   };

      //   if (setupError) {
      //     // failed to setup
      //     // TODO report error
      //     continue;
      //   }

      //   yield* testScenario(operationId, playbook, vault, setupResult.env, scenario);

      //   const [cleanupResult, cleanupError] = yield {
      //     id: `${operationId}-cleanup`,
      //     steps: cleanupScenario(playbook, vault, scenario),
      //   };

      //   if (cleanupError) {
      //     // failed to cleanup
      //     // TODO report error
      //     continue;
      //   }
    }
  },
};

const suite: Suite = {
  description: "Simple BOLA test suite",

  configure: function (spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) {
    const failed = usesBasicAuth(spec, playbook, vault);
    if (failed) {
      return failure({ usesBasicAuth: failed });
    }

    return success({ basicBola });
  },

  tests: {
    basicBola,
  },
};

export default suite;
