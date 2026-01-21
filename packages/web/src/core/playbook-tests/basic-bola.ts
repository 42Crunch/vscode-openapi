import { BundledSwaggerOrOasSpec, getBasicSecuritySchemes } from "@xliic/openapi";
import { Result, success, failure } from "@xliic/result";
import { BasicCredential, Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, Suite, ConfigFailures, TestStageGenerator, TestIssue } from "./types";
import { playbookStageToExecutionStep, StepGenerator } from "../playbook/execute";
import { PlaybookEnvStack, PlaybookLookupResult } from "../playbook/playbook-env";
import {
  hasMultipleBasicAuthCredentials,
  hasValidBasicAuthCredentials,
  usesBasicAuth,
} from "./requirements";
import { getAllOperationIds } from "./selector";
import { mockScenario, OperationVariables } from "./mock";
import { getScenario } from "./scenario";
import { execute } from "./http-api";

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
): TestStageGenerator {
  console.log("Running basic BOLA test for operations:", config.operationId);

  for (const operationId of config.operationId) {
    // first scenario for now
    const scenario = getScenario(playbook, operationId)!;

    const [setupResult, setupError] = yield {
      id: `${operationId}-setup`,
      steps: setupScenario(playbook, vault, scenario),
    };

    if (setupError) {
      // failed to setup
      // TODO report error
      continue;
    }

    yield* testScenario(operationId, playbook, vault, setupResult.env, scenario);

    const [cleanupResult, cleanupError] = yield {
      id: `${operationId}-cleanup`,
      steps: cleanupScenario(playbook, vault, scenario),
    };

    if (cleanupError) {
      // failed to cleanup
      // TODO report error
      continue;
    }
  }
}

async function* setupScenario(
  file: Playbook.Bundle,
  vault: Vault,
  scenario: Playbook.Scenario
): StepGenerator<[]> {
  // Execute all scenario steps except the last one (which is the target operation)
  // For now, just return empty - actual setup will execute prior steps
  return [];
}

async function* cleanupScenario(
  file: Playbook.Bundle,
  vault: Vault,
  scenario: Playbook.Scenario
): StepGenerator<[]> {
  return [];
}

async function* testScenario(
  id: string,
  file: Playbook.Bundle,
  vault: Vault,
  envStack: PlaybookEnvStack,
  scenario: Playbook.Scenario
): TestStageGenerator {
  yield {
    id: `${id}-bola-test`,
    steps: runScenario(scenario, id),
  };
}

async function* runScenario(
  scenario: Playbook.Scenario,
  targetOperationId: string
): StepGenerator<TestIssue[]> {
  const issues = [];
  for (const stage of scenario.requests) {
    if (stage?.ref?.type === "operation" && stage.ref.id === targetOperationId) {
      console.log(`Testing operation for BOLA: ${targetOperationId}`);
      const [response, error] = yield* execute(stage, {
        basic: {
          credential: { type: "basic", default: "", methods: {} },
          value: "user2:password456",
        },
      });
      if (response?.statusCode === 200) {
        issues.push({
          id: "potential-bola",
          message: `Request succeeded - potential BOLA vulnerability (status: ${response?.statusCode}) in operationId ${targetOperationId}`,
        });
      }
    } else {
      yield playbookStageToExecutionStep(stage);
    }
  }
  return issues;
}

async function* testOperation(stage: Playbook.Stage): StepGenerator<TestIssue[]> {
  const [response, error] = yield* execute(stage, {});

  if (error) {
    return [{ id: "request-failed", message: `Request failed: ${error.message}` }];
  }

  // For BOLA testing, a successful response (200, 201, 204) with a different user's ID
  // indicates a potential vulnerability
  if (
    response?.statusCode === 200 ||
    response?.statusCode === 201 ||
    response?.statusCode === 204
  ) {
    return [
      {
        id: "potential-bola",
        message: `Request succeeded - potential BOLA vulnerability (status: ${response?.statusCode})`,
      },
    ];
  }

  return [
    {
      id: "no-issue",
      message: `Request returned status code ${response?.statusCode}`,
    },
  ];
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
    const basicAuthFailed = usesBasicAuth(spec, playbook, vault);
    if (basicAuthFailed) {
      return failure({ usesBasicAuth: basicAuthFailed });
    }

    const credentialsFailed = hasMultipleBasicAuthCredentials(spec, vault, 2);
    if (credentialsFailed) {
      return failure({ hasMultipleCredentials: credentialsFailed });
    }

    return success({ basicBola });
  },

  tests: {
    basicBola,
  },
};

export default suite;
