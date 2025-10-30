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

import { AuthenticationTest, AuthenticationTestSuite, TestSuiteConfigurationResult } from "./types";
import { b } from "vitest/dist/chunks/suite.d.FvehnV49";

function getSecuritySchemes(spec: BundledSwaggerOrOasSpec) {
  return ("swagger" in spec ? spec.securityDefinitions : spec.components?.securitySchemes) ?? {};
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

function matchSchemesToVault(spec: BundledSwaggerOrOasSpec, vault: Vault): string[] {
  const errors: string[] = [];
  const schemes = getSecuritySchemes(spec);
  for (const [name, scheme] of Object.entries(schemes)) {
    const vaultScheme = vault.schemes[name];
    // check if vaultScheme matches scheme
    if (vaultScheme === undefined) {
      errors.push(`Missing vault scheme for security scheme "${name}"`);
    } else if (!checkVaultSchemeType(vaultScheme, scheme)) {
      errors.push(`Mismatched or missing vault scheme for security scheme "${name}"`);
    }
  }

  return errors;
}

function matchActiveSchemesToVault(
  spec: BundledSwaggerOrOasSpec,
  vault: Vault
): Result<Record<string, VaultSecurityScheme | undefined>, string[]> {
  const result: Record<string, VaultSecurityScheme | undefined> = {};
  const errors: string[] = [];
  const activeSchemes = getActiveSecuritySchemes(spec);
  for (const [name, scheme] of Object.entries(activeSchemes)) {
    const vaultScheme = vault.schemes[name];
    // check if vaultScheme matches scheme
    if (vaultScheme !== undefined && checkVaultSchemeType(vaultScheme, scheme)) {
      result[name] = vaultScheme;
    } else {
      result[name] = undefined;
      //errors.push(`Mismatched or missing vault scheme for security scheme "${name}"`);
    }
  }

  if (errors.length > 0) {
    return [undefined, errors];
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

function usesBasicAuth(spec: BundledSwaggerOrOasSpec, vault: Vault): string[] {
  const activeSchemes = getActiveSecuritySchemes(spec);
  for (const scheme of Object.values(activeSchemes)) {
    if (scheme?.type === "http" && scheme?.scheme === "basic") {
      return [];
    }
  }
  return ["No operations using Basic Auth schemes found"];
}

function hasValidBasicAuthCredentials(spec: BundledSwaggerOrOasSpec, vault: Vault): string[] {
  const [schemes, errors] = matchActiveSchemesToVault(spec, vault);
  if (errors !== undefined) {
    return errors;
  }

  console.log("active schemes matched to vault:", schemes);

  const basicSchemes: Record<string, BasicSecurityScheme> = {};

  for (const name of Object.keys(schemes)) {
    const vaultScheme = schemes[name];
    if (vaultScheme?.type === "basic") {
      basicSchemes[name] = vaultScheme;
    }
  }

  if (Object.keys(basicSchemes).length === 0) {
    return ["No matching Vault Basic Auth schemes found"];
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

  return schemesWithNoCredentials;
}

const skipBasicAuth: AuthenticationTest = {
  id: "skip-basic-auth",
  description: "A test that skips Basic Authentication.",
  requirements: [],
  generate(value: string): string[] {
    return [""];
  },
};

// A test that modifies valid basic credential by replacing username:password with username and no password.

const noPassword: AuthenticationTest = {
  id: "no-password",
  //requirements: ["OpenAPI must use Basic Auth", "Vault must have valid Basic Auth credentials"],
  requirements: [
    // ["oas", "usesBasicAuth"],
    // ["vault", "hasBasicAuthCredentials"],
  ],
  generate(value: string): string[] {
    const { username } = parseBasicAuth(value);
    return [`${username}:`];
  },
};

const weakPasswords: AuthenticationTest = {
  id: "weak-passwords",
  requirements: [["must-have-valid-basic-auth-credentials", hasValidBasicAuthCredentials]],
  // output: returns username: with "password" as password and username: with $username as password
  generate(value: string): string[] {
    const { username } = parseBasicAuth(value);
    return [`${username}:password`, `${username}:$username`];
  },
};

const changeUsernameCase: AuthenticationTest = {
  id: "change-username-case",
  requirements: [
    // "OpenAPI must use Basic Auth",
    // "Basic Auth must have case-sensitive usernames",
    // "Vault must have valid Basic Auth credentials",
    // "Basic auth username must have letters which case can be changed",
  ],
  generate: (value: string): string[] => {
    const { username, password } = parseBasicAuth(value);

    const upcased = `${username.toUpperCase()}:${password}`;
    if (upcased !== value) {
      return [upcased];
    }

    const downcased = `${username.toLowerCase()}:${password}`;
    if (downcased !== value) {
      return [downcased];
    }

    return [];
  },
};

const changePasswordCase: AuthenticationTest = {
  id: "change-password-case",
  requirements: [["must-have-valid-basic-auth-credentials", hasValidBasicAuthCredentials]],

  generate: (value: string): string[] => {
    const { username, password } = parseBasicAuth(value);

    const upcased = `${username}:${password.toUpperCase()}`;
    if (upcased !== value) {
      return [upcased];
    }

    const downcased = `${username}:${password.toLowerCase()}`;
    if (downcased !== value) {
      return [downcased];
    }

    return [];
  },
};

function parseBasicAuth(value: string): { username: string; password: string } {
  const [username, password] = value.split(":");
  return { username, password };
}

const suite: AuthenticationTestSuite = {
  id: "basic-authentication-test-suite",
  description: "A suite of tests for Basic Authentication.",
  requirements: [
    ["must-use-basic-auth", usesBasicAuth],
    //["vault-must-match", matchSchemesToVault],
  ],

  tests: [weakPasswords, changePasswordCase],
};

export default suite;
