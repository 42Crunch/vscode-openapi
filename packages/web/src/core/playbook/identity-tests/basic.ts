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
  BasicSecurityScheme,
  Vault,
  SecurityScheme as VaultSecurityScheme,
} from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, Suite, ConfigFailures, TestStage } from "./types";
import { StageGenerator } from "../execute";
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
  ): AsyncGenerator<TestStage, void, unknown> {
    for (const operationId of config.operationId) {
      const result = yield {
        id: operationId,
        stages: () => pickScenarioById(playbook, operationId),
      };
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

async function* pickScenarioById(playbook: Playbook.Bundle, operationId: string): StageGenerator {
  const operation = playbook.operations[operationId];

  const scenario = operation.scenarios?.[0];

  for (const stage of scenario?.requests || []) {
    const result = yield {
      stage,
      hooks: {},
    };
    console.log("Picked scenario step result:", result);
  }
}

export default suite;
