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

async function configure(
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): Promise<Result<BasicTestConfig, ConfigFailures>> {
  const operationIds: string[] = [];

  for (const operationId of getAllOperationIds(oas)) {
    const checkForBola = await canBeTestedForBola(oas, playbook, vault, operationId);
    if (checkForBola) {
      operationIds.push(operationId);
    }
  }

  return success({ operationId: operationIds });
}

async function* run(
  config: BasicTestConfig,
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
) {}

async function canBeTestedForBola(
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault,
  operationId: string
): Promise<boolean> {
  const mock = await mockScenario(oas, playbook, operationId, vault);
  // check mock.variables

  return false;
}

const basicBola: Test<BasicTestConfig> = {
  configure,
  run,
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
