import {
  BundledSwaggerOrOasSpec,
  deref,
  getOperations,
  isSwagger,
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

export function usesAuth(spec: BundledSwaggerOrOasSpec): string | undefined {
  const activeSchemes = getActiveSecuritySchemes(spec);
  if (Object.keys(activeSchemes).length > 0) {
    return undefined;
  }
  return "No operations using authentication found";
}

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

export function hasMultipleBasicAuthCredentials(
  spec: BundledSwaggerOrOasSpec,
  vault: Vault,
  minCredentials: number = 2
): string | undefined {
  const [schemes, errors] = matchActiveSchemesToVault(spec, vault);
  if (errors !== undefined) {
    return errors;
  }

  for (const name of Object.keys(schemes)) {
    const vaultScheme = schemes[name];
    if (vaultScheme?.type === "basic") {
      const credentialCount = Object.keys(vaultScheme.credentials).length;
      if (credentialCount >= minCredentials) {
        return undefined; // Found enough credentials
      }
    }
  }

  return `BOLA testing requires at least ${minCredentials} credentials in the vault`;
}

export function hasAtLeastTwoSecuritySchemes(spec: BundledSwaggerOrOasSpec): string | undefined {
  const schemes = getActiveSecuritySchemes(spec);
  if (Object.keys(schemes).length < 2) {
    return "API must have at least two security schemes";
  }
}

export function hasCredentialsForAllSchemes(
  spec: BundledSwaggerOrOasSpec,
  vault: Vault
): string | undefined {
  const [schemes, schemesError] = matchActiveSchemesToVault(spec, vault);

  if (schemesError !== undefined) {
    return `Failed to get schemes: ${schemesError}`;
  }

  const missingSchemes: string[] = [];
  const emptySchemes: string[] = [];

  for (const [name, vaultScheme] of Object.entries(schemes)) {
    if (!vaultScheme) {
      missingSchemes.push(name);
    } else if ("credentials" in vaultScheme && Object.keys(vaultScheme.credentials).length === 0) {
      emptySchemes.push(name);
    }
  }

  if (missingSchemes.length > 0) {
    return `Vault is missing schemes: ${missingSchemes.join(", ")}`;
  }

  if (emptySchemes.length > 0) {
    return `Vault has no credentials for schemes: ${emptySchemes.join(", ")}`;
  }
  return undefined;
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
  if (scheme.type === "basic" && vaultScheme.type === "basic") {
    return true;
  }
  if (scheme.type === "apiKey" && vaultScheme.type === "apiKey") {
    return true;
  }
  if (
    scheme.type === "http" &&
    scheme.scheme?.toLowerCase() === "bearer" &&
    vaultScheme.type === "bearer"
  ) {
    return true;
  }
  if (scheme.type === "oauth2" && vaultScheme.type === "oauth2") {
    return true;
  }
  if (scheme.type === "openIdConnect" && vaultScheme.type === "openIdConnect") {
    return true;
  }
  if (scheme.type === "mutualTLS" && vaultScheme.type === "mutualTLS") {
    return true;
  }
  return false;
}

export function getSecuritySchemeNames(oas: BundledSwaggerOrOasSpec): Set<string> {
  if (isSwagger(oas)) {
    return oas.securityDefinitions ? new Set(Object.keys(oas.securityDefinitions)) : new Set();
  } else {
    return oas.components?.securitySchemes
      ? new Set(Object.keys(oas.components.securitySchemes))
      : new Set();
  }
}

function getActiveSecuritySchemeNames(spec: BundledSwaggerOrOasSpec): Set<string> {
  const result = new Set<string>();
  const operations = getOperations(spec);
  for (const [, , operation] of operations) {
    const security = operation.security ?? spec.security ?? [];
    for (const entry of security) {
      for (const name of Object.keys(entry)) {
        result.add(name);
      }
    }
  }

  return result;
}

function getSecurityScheme(oas: BundledSwaggerOrOasSpec, name: string) {
  if (isSwagger(oas)) {
    return oas.securityDefinitions?.[name];
  } else {
    return oas.components?.securitySchemes?.[name];
  }
}

function getActiveSecuritySchemes(
  spec: BundledSwaggerOrOasSpec
): Record<string, Swagger.SecurityScheme | OpenApi30.SecurityScheme | OpenApi31.SecurityScheme> {
  const names = getActiveSecuritySchemeNames(spec);
  const entries = Array.from(names).map((name) => {
    const scheme = getSecurityScheme(spec, name);
    const dereferenced = deref(spec, scheme);
    return [name, dereferenced];
  });
  return Object.fromEntries(entries);
}
