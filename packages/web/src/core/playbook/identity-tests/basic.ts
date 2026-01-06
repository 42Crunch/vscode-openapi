import { BundledSwaggerOrOasSpec, getBasicSecuritySchemes } from "@xliic/openapi";
import { Result, success, failure } from "@xliic/result";
import { BasicCredential, Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, Suite, ConfigFailures, TestStageGenerator, TestIssue } from "./types";
import { StepGenerator } from "../execute";
import { selectOperationBySecurityScheme, selectOperationsToTest } from "./selector";
import { PlaybookEnvStack } from "../playbook-env";
import { execute } from "../test-http-api";
import { hasValidBasicAuthCredentials, usesBasicAuth } from "../test-requirements";

type TruncateTestConfig = TestConfig & {
  operationId: string[];
};

const truncatedPasswordsTest: Test<TruncateTestConfig> = {
  configure: function (
    oas: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): Result<TruncateTestConfig, ConfigFailures> {
    const failed = hasValidBasicAuthCredentials(oas, playbook, vault);
    if (failed) {
      return failure({ hasValidBasicAuthCredentials: failed });
    }

    const schemes = getBasicSecuritySchemes(oas);
    // check if not empty, pick first one for now
    const operations = selectOperationBySecurityScheme(oas, schemes[0]);

    // check if not empty, pick first one for now
    const toTest = selectOperationsToTest(oas, operations);

    return success({ operationId: toTest });
  },

  run: async function* (
    config: TruncateTestConfig,
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ) {
    for (const operationId of config.operationId) {
      console.log(`Running truncated passwords test for operation: ${operationId}`);

      const operation = playbook.operations[operationId];
      const scenario = operation.scenarios?.[0];

      console.log("Scenario:", scenario);

      const [setupResult, setupError] = yield {
        id: `${operationId}-setup`,
        steps: setupScenario(playbook, vault, scenario),
      };

      if (setupError) {
        console.log("Setup error:", setupError);
        continue;
      }

      console.log("Setup result:", setupResult);

      yield* testScenario(operationId, playbook, vault, setupResult.env, scenario!.requests[0]);
    }
  },
};

const suite: Suite = {
  description: "A suite of tests for Basic Authentication.",

  configure: function (
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): Result<Record<string, Test<TestConfig>>, ConfigFailures> {
    const failed = usesBasicAuth(spec, playbook, vault);
    if (failed) {
      return failure({ usesBasicAuth: failed });
    }

    return success({ truncatedPasswordsTest });
  },

  tests: {
    truncatedPasswordsTest,
  },
};

function getRequestByRef(file: Playbook.Bundle, ref: Playbook.RequestRef) {
  return ref.type === "operation" ? file.operations[ref.id]?.request : file.requests?.[ref.id];
}

function getVaultCredential(vault: Vault, schemeName: string): BasicCredential {
  const vaultScheme = vault.schemes[schemeName];
  // FIXME handle different types
  if (vaultScheme === undefined || vaultScheme.type !== "basic") {
    throw new Error(`Vault scheme "${schemeName}" not found / FIXME`);
  }
  const credentials = Object.values(vaultScheme.credentials);
  if (credentials.length === 0) {
    throw new Error(`No credentials in vault scheme "${schemeName}" / FIXME`);
  }
  return credentials[0] as BasicCredential;
}

function truncatedThree(credential: BasicCredential): BasicCredential[] {
  const { username, password } = credential;
  if (password.length < 4) {
    // TODO return error
    return [];
  }

  const truncated1 = password.substring(0, password.length - 1);
  const truncated2 = password.substring(0, password.length - 2);
  const truncated3 = password.substring(0, password.length - 3);

  return [
    { username, password: truncated1 },
    { username, password: truncated2 },
    { username, password: truncated3 },
  ];
}

function basicCredentialToString(credential: BasicCredential): string {
  return `${credential.username}:${credential.password}`;
}

async function* setupScenario(
  file: Playbook.Bundle,
  vault: Vault,
  scenario: Playbook.Scenario
): StepGenerator<[]> {
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
  stage: Playbook.Stage
): TestStageGenerator {
  const request = getRequestByRef(file, stage.ref!);
  const schemeName = (request as Playbook.StageContent)?.auth?.[0];
  const credential = getVaultCredential(vault, schemeName!);
  const credentials = truncatedThree(credential);
  for (let i = 0; i < credentials.length; i++) {
    yield {
      id: `${id}-truncated-test=${i}`,
      steps: testScenarioStage(file, vault, envStack, stage, credentials[i]),
    };
  }
}

async function* testScenarioStage(
  file: Playbook.Bundle,
  vault: Vault,
  envStack: PlaybookEnvStack,
  stage: Playbook.Stage,
  credential: BasicCredential
): StepGenerator<TestIssue[]> {
  const credentialString = basicCredentialToString(credential);
  const [response, error] = yield* execute(stage, {
    basic: {
      credential: { type: "basic", default: "", methods: {} },
      value: credentialString,
    },
  });

  if (error) {
    return [{ id: "request failed", message: `Request failed: ${error.message}` }];
  }

  if (
    response?.statusCode === 200 ||
    response?.statusCode === 201 ||
    response?.statusCode === 204
  ) {
    return [{ id: "issue", message: `Request succeeded with truncated password` }];
  }

  return [
    {
      id: "no.issue",
      message: `Request failed as expected with status code ${response?.statusCode}`,
    },
  ];
}

export default suite;
