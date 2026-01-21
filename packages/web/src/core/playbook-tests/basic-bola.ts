import { BundledSwaggerOrOasSpec, getBasicSecuritySchemes } from "@xliic/openapi";
import { Result, success, failure } from "@xliic/result";
import { BasicCredential, Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, Suite, ConfigFailures, TestStageGenerator, TestIssue } from "./types";
import { hasValidBasicAuthCredentials, usesBasicAuth } from "./requirements";
import { getAllOperationIds } from "./selector";
import { mockScenario, OperationVariables } from "./mock";
import { PlaybookLookupResult } from "../playbook/playbook-env";
import { getScenario } from "./scenario";

type BasicBolaTestConfig = TestConfig & {
  operationId: string[];
};

async function configure(
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): Promise<Result<BasicBolaTestConfig, ConfigFailures>> {
  const operationIds: string[] = [];

  for (const operationId of getAllOperationIds(oas)) {
    const checkForBola = await canBeTestedForBola(oas, playbook, vault, operationId);
    if (checkForBola) {
      operationIds.push(operationId);
    }
  }

  console.log("BOLA testable operations:", operationIds);

  return success({ operationId: operationIds });
}

async function* run(
  config: BasicBolaTestConfig,
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
) {
  console.log("Running basic BOLA test for operations:", config.operationId);

  for (const operationId of config.operationId) {
    // first scenario for now
    const scenario = getScenario(playbook, operationId);
  }
}

function isBolaInjectableParameter(found: PlaybookLookupResult): boolean {
  // bola injectable parameters are parameters in the path (for now)
  const path = found.location.path;
  return (
    path.length === 4 &&
    path[0] === "parameters" &&
    path[1] === "path" &&
    typeof path[2] === "number" &&
    path[3] === "value"
  );
}

function hasBolaInjectionTargets(variables: OperationVariables[], operationId: string): boolean {
  // check if any of the injectable parameters were set by operations prior to this one
  const operationIndex = variables.findIndex((v) => v.operationId === operationId);
  if (operationIndex === -1) {
    return false;
  }

  const operation = variables[operationIndex];

  for (const found of operation.found) {
    // if parameter of interest comes from prior step, then it's a valid injection target
    if (
      (isBolaInjectableParameter(found) && found.source.type === "playbook-request") ||
      found.source.type === "playbook-stage"
    ) {
      if (found.source.step < operationIndex) {
        console.log(
          `Parameter "${found.name}" of operation "${operation.operationId}" comes from step ${found.source.step}, injectable!`
        );
        return true;
      }
    }
  }

  return false;
}

async function canBeTestedForBola(
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault,
  operationId: string
): Promise<boolean> {
  const mock = await mockScenario(oas, playbook, operationId, vault);

  return hasBolaInjectionTargets(mock.variables, operationId);
}

const basicBola: Test<BasicBolaTestConfig> = {
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
