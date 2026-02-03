import {
  BundledSwaggerOrOasSpec,
  SecurityRequirement,
  getSecurityRequirementsById,
  getSecuritySchemes,
} from "@xliic/openapi";
import { Result, success } from "@xliic/result";
import { Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, ConfigFailures, TestStageGenerator, TestIssue } from "../types";
import { playbookStageToExecutionStep, StepGenerator } from "../../playbook/execute";
import { PlaybookEnvStack, PlaybookLookupResult } from "../../playbook/playbook-env";

import { getAllOperationIds } from "../selector";
import { mockScenario, OperationVariables } from "../mock";
import { getScenario } from "../scenario";
import { execute } from "../http-api";
import { updateSecurityRequirements } from "../mutate-oas";

type BasicSecReqTestConfig = TestConfig & {
  operationId: string[];
};

async function configure(
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): Promise<Result<BasicSecReqTestConfig, ConfigFailures>> {
  const operationIds: string[] = [];

  for (const operationId of getAllOperationIds(oas)) {
    const securityRequirements = getSecurityRequirementsById(oas, operationId);

    if (securityRequirements.length > 0) {
      operationIds.push(operationId);
    }
  }

  return success({ operationId: operationIds });
}

async function* run(
  config: BasicSecReqTestConfig,
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): TestStageGenerator {
  console.log("Running basic seqreq test for operations:", config.operationId);

  for (const operationId of config.operationId) {
    // first scenario for now
    const scenario = getScenario(playbook, operationId)!;

    const stageToTest = findStageToTest(scenario, operationId);

    const [setupResult, setupError] = yield {
      id: `${operationId}-setup`,
      steps: setupScenario(playbook, vault, scenario),
    };

    if (setupError) {
      // failed to setup
      // TODO report error
      continue;
    }

    yield* testScenario(oas, operationId, playbook, vault, setupResult.env, scenario, stageToTest!);

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

function getAlternativeSecurityRequirements(
  oas: BundledSwaggerOrOasSpec,
  operationRequirements: SecurityRequirement[]
): SecurityRequirement[] {
  const schemeNames = Object.keys(getSecuritySchemes(oas));

  const existing = operationRequirements.map((req) => new Set(Object.keys(req)));

  return powerSet(schemeNames)
    .filter((candidate) => !existing.some((req) => req.isSubsetOf(candidate)))
    .map((subset) => Object.fromEntries([...subset].map((name) => [name, []])));
}

function powerSet(items: string[]): Set<string>[] {
  const result: Set<string>[] = [];
  for (let mask = 1; mask < 1 << items.length; mask++) {
    const subset = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        subset.add(items[i]);
      }
    }
    result.push(subset);
  }
  return result;
}

async function* testScenario(
  oas: BundledSwaggerOrOasSpec,
  id: string,
  file: Playbook.Bundle,
  vault: Vault,
  envStack: PlaybookEnvStack,
  scenario: Playbook.Scenario,
  stageToTest: number
): TestStageGenerator {
  const operationRequirements = getSecurityRequirementsById(oas, id);
  const alternatives = getAlternativeSecurityRequirements(oas, operationRequirements);

  yield {
    id: `${id}-seqreq-test`,
    steps: runScenario(oas, scenario, stageToTest, alternatives),
  };
}

async function* runScenario(
  oas: BundledSwaggerOrOasSpec,
  scenario: Playbook.Scenario,
  stageToTest: number,
  security: SecurityRequirement[]
): StepGenerator<TestIssue[]> {
  const issues = [];

  for (let i = 0; i < scenario.requests.length; i++) {
    const stage = scenario.requests[i];

    if (i !== stageToTest) {
      yield playbookStageToExecutionStep(stage);
      continue;
    }

    const operationId = stage.ref?.type === "operation" ? stage.ref.id : `stage-${i}`;

    console.log(
      `Testing operation for SEQREQ: ${operationId} with schemes: ${JSON.stringify(security)}`
    );

    const [patched, error0] = updateSecurityRequirements(oas, operationId, [security[0]]);

    if (error0 !== undefined) {
      console.log(`Failed to patch security requirements: ${error0}`);
      continue;
    }

    const auth = Object.keys(security[0]);

    const [response, error] = yield* execute({ ...stage, auth }, { oas: patched });

    if (response?.statusCode === 200) {
      issues.push({
        id: "security-requirements-not-enforced",
        message: `Request succeeded with alternative security scheme "${JSON.stringify(
          security[0]
        )}" (status: ${response?.statusCode}) in operationId ${operationId}`,
      });
    }
  }

  return issues;
}

function findStageToTest(scenario: Playbook.Scenario, operationId: string): number | undefined {
  for (let i = 0; i < scenario.requests.length; i++) {
    const stage = scenario.requests[i];
    if (stage?.ref?.type === "operation" && stage.ref.id === operationId && stage.fuzzing) {
      return i;
    }
  }
  return undefined;
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

  console.log(`Mocked scenario for operationId "${operationId}":`, mock);

  return hasBolaInjectionTargets(mock.variables, operationId);
}

export default {
  configure,
  run,
} satisfies Test<BasicSecReqTestConfig>;
