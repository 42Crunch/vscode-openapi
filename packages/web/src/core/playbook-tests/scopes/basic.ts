import {
  BundledSwaggerOrOasSpec,
  SecurityRequirement,
  getSecurityRequirementsById,
  getSecuritySchemes,
} from "@xliic/openapi";
import { Result, success } from "@xliic/result";
import { Vault, CredentialMetadata, SecurityCredential } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, ConfigFailures, TestStageGenerator, TestIssue } from "../types";
import { playbookStageToExecutionStep, StepGenerator } from "../../playbook/execute";
import { PlaybookEnvStack } from "../../playbook/playbook-env";
import { AuthResult } from "../../playbook/playbook";

import { getAllOperationIds } from "../selector";
import { getScenario } from "../scenario";
import { execute } from "../http-api";
import { getScheme, maybeResolveAliasScheme } from "../../vault";

type BasicSecReqTestConfig = TestConfig & {
  operationId: string[];
};

type ScopeTestCase = {
  schemeName: string;
  credentialName: string;
  credentialScopes: string[];
  requiredScopes: string[];
  authOverride: AuthResult;
};

async function configure(
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): Promise<Result<BasicSecReqTestConfig, ConfigFailures>> {
  const operationIds: string[] = [];

  for (const operationId of getAllOperationIds(oas)) {
    const securityRequirements = getSecurityRequirementsById(oas, operationId);
    const hasScopes = securityRequirements.some((req) =>
      Object.values(req).some((scopes) => scopes.length > 0)
    );
    if (hasScopes) {
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
  console.log("Running basic scopes test for operations:", config.operationId);

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
      continue;
    }

    yield* testScenario(oas, operationId, playbook, vault, setupResult.env, scenario, stageToTest!);

    const [cleanupResult, cleanupError] = yield {
      id: `${operationId}-cleanup`,
      steps: cleanupScenario(playbook, vault, scenario),
    };

    if (cleanupError) {
      // failed to cleanup
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
  const testCases = findCredentialsWithInsufficientScopes(vault, operationRequirements);

  if (testCases.length === 0) {
    console.log(`No credentials with insufficient scopes found for operation ${id}`);
    return;
  }

  console.log(
    `Testing operation ${id} with ${testCases.length} credential(s) with insufficient scopes`
  );

  yield {
    id: `${id}-scopes-test`,
    steps: runScenario(scenario, stageToTest, testCases),
  };
}

async function* runScenario(
  scenario: Playbook.Scenario,
  stageToTest: number,
  testCases: ScopeTestCase[]
): StepGenerator<TestIssue[]> {
  const issues: TestIssue[] = [];

  for (let i = 0; i < scenario.requests.length; i++) {
    const stage = scenario.requests[i];

    if (i !== stageToTest) {
      yield playbookStageToExecutionStep(stage);
      continue;
    }

    const operationId = stage.ref?.type === "operation" ? stage.ref.id : `stage-${i}`;

    for (const testCase of testCases) {
      console.log(
        `Testing operation ${operationId} with credential "${testCase.credentialName}" ` +
          `from scheme "${testCase.schemeName}" ` +
          `(scopes: [${testCase.credentialScopes}]) against required scopes [${testCase.requiredScopes}]`
      );

      const [response, error] = yield* execute(stage, { security: testCase.authOverride });

      if (response && response.statusCode >= 200 && response.statusCode < 300) {
        issues.push({
          id: "scopes-not-enforced",
          message:
            `Request to ${operationId} succeeded (status: ${response.statusCode}) ` +
            `using credential "${testCase.credentialName}" from scheme "${testCase.schemeName}" ` +
            `with scopes [${testCase.credentialScopes}] ` +
            `which do not satisfy required scopes [${testCase.requiredScopes}]`,
        });
      }
    }
  }

  return issues;
}

function findCredentialsWithInsufficientScopes(
  vault: Vault,
  requirements: SecurityRequirement[]
): ScopeTestCase[] {
  const result: ScopeTestCase[] = [];
  const seen = new Set<string>();

  for (const requirement of requirements) {
    for (const [schemeName, requiredScopes] of Object.entries(requirement)) {
      if (requiredScopes.length === 0) continue;

      const [scheme, schemeError] = getScheme(vault, schemeName);
      if (schemeError !== undefined) continue;

      const [credScheme, aliasError] = maybeResolveAliasScheme(vault, scheme);
      if (aliasError !== undefined) continue;

      const requiredScopeSet = new Set(requiredScopes);

      for (const [credName, credential] of Object.entries(credScheme.credentials)) {
        const key = `${schemeName}/${credName}`;
        if (seen.has(key)) continue;

        const credentialScopes = new Set((credential as CredentialMetadata).scopes ?? []);

        if (!requiredScopeSet.isSubsetOf(credentialScopes)) {
          const value = getCredentialValue(credential as SecurityCredential);
          if (value === undefined) continue;

          seen.add(key);

          const authOverride: AuthResult = {
            [schemeName]: {
              credential: {
                type: credScheme.type as Playbook.Credential["type"],
                default: "",
                methods: {},
              },
              value,
            },
          };

          result.push({
            schemeName,
            credentialName: credName,
            credentialScopes: (credential as CredentialMetadata).scopes ?? [],
            requiredScopes,
            authOverride,
          });
        }
      }
    }
  }

  return result;
}

function getCredentialValue(credential: SecurityCredential): string | undefined {
  if ("token" in credential) return credential.token;
  if ("key" in credential) return credential.key;
  if ("username" in credential) return `${credential.username}:${credential.password}`;
  return undefined;
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
