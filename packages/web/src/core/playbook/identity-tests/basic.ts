import {
  BundledSwaggerOrOasSpec,
  deref,
  getBasicSecuritySchemes,
  getOperations,
  OpenApi30,
  OpenApi31,
  Swagger,
} from "@xliic/openapi";
import { Result, success, failure } from "@xliic/result";
import {
  BasicCredential,
  BasicSecurityScheme,
  Vault,
  SecurityScheme as VaultSecurityScheme,
} from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, Suite, ConfigFailures, TestStage } from "./types";
import { StepGenerator } from "../execute";
import { selectOperationBySecurityScheme, selectOperationsToTest } from "./selector";

function getActiveSecuritySchemes(spec: BundledSwaggerOrOasSpec) {
  const result: Record<
    string,
    Swagger.SecurityScheme | OpenApi30.SecurityScheme | OpenApi31.SecurityScheme
  > = {};
  const operations = getOperations(spec);
  for (const [, , operation] of operations) {
    const security = operation.security ?? spec.security ?? [];
    for (const entry of security) {
      for (const name of Object.keys(entry)) {
        const schemeOrRef =
          "swagger" in spec
            ? spec.securityDefinitions?.[name]
            : spec.components?.securitySchemes?.[name];
        const scheme = deref(spec, schemeOrRef);
        if (scheme) {
          result[name] = scheme;
        }
      }
    }
  }

  return result;
}

function matchActiveSchemesToVault(
  spec: BundledSwaggerOrOasSpec,
  vault: Vault
): Result<Record<string, VaultSecurityScheme | undefined>, string> {
  const result: Record<string, VaultSecurityScheme | undefined> = {};
  const activeSchemes = getActiveSecuritySchemes(spec);
  for (const [name, scheme] of Object.entries(activeSchemes)) {
    const vaultScheme = vault.schemes[name];
    // check if vaultScheme matches scheme
    if (vaultScheme !== undefined && checkVaultSchemeType(vaultScheme, scheme)) {
      result[name] = vaultScheme;
    } else {
      result[name] = undefined;
    }
  }

  return [result, undefined];
}

function checkVaultSchemeType(
  vaultScheme: VaultSecurityScheme,
  scheme: Swagger.SecurityScheme | OpenApi30.SecurityScheme | OpenApi31.SecurityScheme
): boolean {
  if (scheme.type === "http" && scheme.scheme === "basic" && vaultScheme.type === "basic") {
    return true;
  }
  return false;
}

function usesBasicAuth(
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): string | undefined {
  const activeSchemes = getActiveSecuritySchemes(spec);
  for (const scheme of Object.values(activeSchemes)) {
    if (scheme?.type === "http" && scheme?.scheme === "basic") {
      return undefined;
    }
  }
  return "No operations using Basic Auth schemes found";
}

function hasValidBasicAuthCredentials(
  spec: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault
): string {
  const [schemes, errors] = matchActiveSchemesToVault(spec, vault);
  if (errors !== undefined) {
    return errors;
  }

  const basicSchemes: Record<string, BasicSecurityScheme> = {};

  for (const name of Object.keys(schemes)) {
    const vaultScheme = schemes[name];
    if (vaultScheme?.type === "basic") {
      basicSchemes[name] = vaultScheme;
    }
  }

  if (Object.keys(basicSchemes).length === 0) {
    return "No matching Vault Basic Auth schemes found";
  }

  const schemesWithNoCredentials: string[] = [];
  for (const name of Object.keys(basicSchemes)) {
    const vaultScheme = basicSchemes[name];
    if (Object.keys(vaultScheme.credentials).length === 0) {
      schemesWithNoCredentials.push(
        `No credentials found in vault for Basic Auth scheme "${name}"`
      );
    }
  }

  return schemesWithNoCredentials.join("; ");
}

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

      const envStack = yield {
        id: operationId,
        steps: () => testStageFoo(playbook, vault, scenario!.requests[0]),
      };

      console.log("Got env stack:", envStack);
      console.log("Running second iteration with truncated passwords...");
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

async function* pickScenarioById(playbook: Playbook.Bundle, operationId: string): StepGenerator {
  const operation = playbook.operations[operationId];

  const scenario = operation.scenarios?.[0];

  for (const stage of scenario?.requests || []) {
    const result = yield {
      stage,
      hooks: {},
    };
    console.log("Received step execution:", result);
  }
}

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

async function* testStageFoo(
  file: Playbook.Bundle,
  vault: Vault,
  stage: Playbook.Stage
): StepGenerator {
  // const schemeName = getSchemeNameByOperationId(spec, operationId);
  // const credential = getVaultCredential(vault, schemeName);
  // const credentials = truncatedThree(credential);

  const request = getRequestByRef(file, stage.ref!);

  const schemeName = (request as Playbook.StageContent)?.auth?.[0];

  const credential = getVaultCredential(vault, schemeName!);
  const credentials = truncatedThree(credential);

  for (const credential of credentials) {
    const credentialString = basicCredentialToString(credential);

    console.log("Stage auth before modification:", schemeName);

    const result = yield {
      stage,
      hooks: {
        security: async function* (auth) {
          return {
            basic: {
              credential: { type: "basic", default: "", methods: {} },
              value: credentialString,
            },
          };
        },
      },
    };
    console.log("Received step execution in foo:", result);
  }
}

export default suite;
