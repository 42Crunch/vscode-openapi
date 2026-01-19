import {
  BundledSwaggerOrOasSpec,
  deref,
  getOperations,
  OpenApi30,
  OpenApi31,
  Swagger,
} from "@xliic/openapi";
import { Result } from "@xliic/result";
import {
  BasicSecurityScheme,
  Vault,
  SecurityScheme as VaultSecurityScheme,
} from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

export function usesBasicAuth(
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

export function hasValidBasicAuthCredentials(
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
