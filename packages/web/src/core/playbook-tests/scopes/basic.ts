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

  // TODO find operations that have security requirements with scopes

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
  // find tokens to use for testing

  yield {
    id: `${id}-seqreq-test`,
    steps: runScenario(oas, scenario, stageToTest, tokens),
  };
}

async function* runScenario(
  oas: BundledSwaggerOrOasSpec,
  scenario: Playbook.Scenario,
  stageToTest: number,
  tokens: string[]
): StepGenerator<TestIssue[]> {
  const issues = [];

  for (let i = 0; i < scenario.requests.length; i++) {
    const stage = scenario.requests[i];

    if (i !== stageToTest) {
      yield playbookStageToExecutionStep(stage);
      continue;
    }

    const operationId = stage.ref?.type === "operation" ? stage.ref.id : `stage-${i}`;

    // TODO geneate auth using tokens, execute request with each token and make sure it does not succeed

    const [response, error] = yield* execute({ ...stage, auth });
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

export default {
  configure,
  run,
} satisfies Test<BasicSecReqTestConfig>;
