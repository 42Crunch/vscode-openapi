import { BundledSwaggerOrOasSpec, getBasicSecuritySchemes } from "@xliic/openapi";
import { Result, success, failure } from "@xliic/result";
import { BasicCredential, Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";
import { LookupResult } from "@xliic/common/env";

import { Test, TestConfig, Suite, ConfigFailures, TestStageGenerator, TestIssue } from "./types";
import { hasValidBasicAuthCredentials, usesBasicAuth } from "./requirements";
import { getAllOperationIds } from "./selector";
import { mockScenario, OperationVariables } from "./mock";

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

  console.log("BOLA testable operations:", operationIds);

  return success({ operationId: operationIds });
}

async function* run(
  config: BasicTestConfig,
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
) {}

type ContextWithStep = {
  type: "playbook-request" | "playbook-stage";
  step: number;
};

function hasStep(context: { type: string }): context is ContextWithStep {
  return (
    (context.type === "playbook-request" || context.type === "playbook-stage") && "step" in context
  );
}

function isPathParameter(found: LookupResult): boolean {
  const path = found.location.path;
  return (
    path.length === 4 &&
    path[0] === "parameters" &&
    path[1] === "path" &&
    typeof path[2] === "number" &&
    path[3] === "value"
  );
}

function checkVariablesForBola(variables: OperationVariables[], operationId: string): boolean {
  const operationIndex = variables.findIndex((v) => v.operationId === operationId);
  if (operationIndex === -1) {
    return false;
  }

  const operation = variables[operationIndex];

  for (const found of operation.found) {
    if (isPathParameter(found) && hasStep(found.context)) {
      if (found.context.step < operationIndex) {
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
  return checkVariablesForBola(mock.variables, operationId);
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
