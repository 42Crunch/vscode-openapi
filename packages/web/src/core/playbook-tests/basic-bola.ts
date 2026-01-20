import { BundledSwaggerOrOasSpec, getBasicSecuritySchemes } from "@xliic/openapi";
import { Result, success, failure } from "@xliic/result";
import { BasicCredential, Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, Suite, ConfigFailures, TestStageGenerator, TestIssue } from "./types";
import { hasValidBasicAuthCredentials, usesBasicAuth } from "./requirements";
import { getAllOperationIds } from "./selector";
import { mockScenario } from "./mock";

type BasicTestConfig = TestConfig & {
  operationId: string[];
};

const basicBola: Test<BasicTestConfig> = {
  configure: async function (
    oas: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): Promise<Result<BasicTestConfig, ConfigFailures>> {
    const operationIds = getAllOperationIds(oas);
    console.log("Im configuring Bola Tests");
    const first = operationIds[0];
    if (first) {
      const result = await mockScenario(oas, playbook, first, vault);
      console.log("Mock scenario result:", result);
    }
    return success({ operationId: operationIds });
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
