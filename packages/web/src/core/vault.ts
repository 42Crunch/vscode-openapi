import { Result } from "@xliic/result";
import {
  Vault,
  SecurityScheme,
  CredentialsSecurityScheme,
  SecurityCredential,
  CredentialMetadata,
} from "@xliic/common/vault";
import { SecurityRequirement } from "@xliic/openapi";

export function getScheme(vault: Vault, schemeName: string): Result<SecurityScheme, string> {
  const scheme = vault.schemes[schemeName];
  if (!scheme) {
    return [undefined, `Scheme '${schemeName}' not found in vault`];
  }
  return [scheme, undefined];
}

export function maybeResolveAliasScheme(
  vault: Vault,
  scheme: SecurityScheme
): Result<CredentialsSecurityScheme, string> {
  if (scheme.type !== "alias") {
    return [scheme, undefined];
  }

  const [aliasScheme, aliasError] = getScheme(vault, scheme.scheme);
  if (aliasError !== undefined) {
    return [undefined, `Target of alias scheme '${scheme.scheme}' not found: ${aliasError}`];
  }
  if (aliasScheme.type === "alias") {
    return [undefined, `Alias scheme '${scheme.scheme}' cannot point to another alias scheme.`];
  } else {
    return [aliasScheme, undefined];
  }
}

export function getCredentialNamesFromScheme(
  vault: Vault,
  schemeName: string
): Result<string[], string> {
  const [scheme, error] = getScheme(vault, schemeName);
  if (error !== undefined) {
    return [undefined, error];
  }

  const [credentialScheme, aliasError] = maybeResolveAliasScheme(vault, scheme);
  if (aliasError !== undefined) {
    return [undefined, aliasError];
  }

  return [Object.keys(credentialScheme.credentials), undefined];
}

export function getCredentialByName(
  vault: Vault,
  schemeName: string,
  credentialName: string
): Result<SecurityCredential, string> {
  const [scheme, error] = getScheme(vault, schemeName);
  if (error !== undefined) {
    return [undefined, error];
  }

  const [credentialScheme, aliasError] = maybeResolveAliasScheme(vault, scheme);
  if (aliasError !== undefined) {
    return [undefined, aliasError];
  }

  const credential = credentialScheme.credentials[credentialName];
  if (credential === undefined) {
    return [undefined, `Credential '${credentialName}' not found in scheme '${schemeName}'`];
  }

  return [credential, undefined];
}

export function getAnyCredential(
  vault: Vault,
  schemeName: string,
  security?: SecurityRequirement[]
): Result<SecurityCredential, string> {
  const [scheme, error] = getScheme(vault, schemeName);
  if (error !== undefined) {
    return [undefined, error];
  }

  const [credentialScheme, aliasError] = maybeResolveAliasScheme(vault, scheme);
  if (aliasError !== undefined) {
    return [undefined, aliasError];
  }

  // Collect non-empty scope sets required for this scheme across security alternatives
  if (security) {
    const scopeSets: Set<string>[] = [];
    for (const req of security) {
      if (schemeName in req && req[schemeName].length > 0) {
        scopeSets.push(new Set(req[schemeName]));
      }
    }

    if (scopeSets.length > 0) {
      for (const credential of Object.values(credentialScheme.credentials)) {
        const credentialScopes = new Set((credential as CredentialMetadata).scopes ?? []);
        if (scopeSets.some((required) => required.isSubsetOf(credentialScopes))) {
          return [credential, undefined];
        }
      }
      return [undefined, `No credential in scheme '${schemeName}' satisfies the required scopes`];
    }
  }

  const first = Object.values(credentialScheme.credentials)[0];
  if (first === undefined) {
    return [undefined, `No credentials found in scheme '${schemeName}'`];
  }

  return [first, undefined];
}
