import {
  BundledSwaggerOrOasSpec,
  deref,
  getOperationById,
  getOperations,
  OpenApi30,
  OpenApi31,
  Swagger,
} from "@xliic/openapi";
import { Result } from "@xliic/result";
import {
  BasicCredential,
  BasicSecurityScheme,
  SecurityCredential,
  Vault,
  SecurityScheme as VaultSecurityScheme,
} from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Test, TestConfig, Suite } from "./types";
import { StageGenerator } from "../execute";
import { AuthResult } from "../playbook";

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

// const skipBasicAuth: AuthenticationTest = {
//   id: "skip-basic-auth",
//   description: "A test that skips Basic Authentication.",
//   requirements: [],
//   generate(value: string): string[] {
//     return [""];
//   },
// };

// A test that modifies valid basic credential by replacing username:password with username and no password.

// const noPassword: AuthenticationTest = {
//   id: "no-password",
//   //requirements: ["OpenAPI must use Basic Auth", "Vault must have valid Basic Auth credentials"],
//   requirements: [
//     // ["oas", "usesBasicAuth"],
//     // ["vault", "hasBasicAuthCredentials"],
//   ],
//   generate(value: string): string[] {
//     const { username } = parseBasicAuth(value);
//     return [`${username}:`];
//   },
// };

// truncate password test
// select operation (using some function, etc)
// modify credentials, from the vault, and inject it into the operation
// verify that operation fails (check response status, etc), perhaps having an idea what's a valid
// response looks like would have in verification step

// let's say we know operation id and schema we're going to use, this can be passed via test configuration

/*
const truncatePassword: Test = {
  requirements: [["must-have-valid-basic-auth-credentials", hasValidBasicAuthCredentials]],
  run: function (config: TestConfiguration): { id: string; stages: () => StageGenerator }[] {
    return [{ id: "zomg", stages: () => operation("userinfo") }];
  },
};
// output: returns username: with password truncated to N characters
*/

function selectOperationId(): string[] {
  return ["user-info-basic-trim"];
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

type TruncateTestConfig = TestConfig & {
  operationId: string[];
};

const truncatedPasswordsTest: Test<TruncateTestConfig> = {
  requirements: { hasValidBasicAuthCredentials },
  // output: returns username: with "password" as password and username: with $username as password
  // generate(value: string): string[] {
  //   const { username } = parseBasicAuth(value);
  //   return [`${username}:password`, `${username}:$username`];
  // },

  configure: function (
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): TruncateTestConfig {
    const operationId = selectOperationId();

    return {
      ready: true,
      failures: {},
      operationId,
    };
  },

  run: function (
    config: TruncateTestConfig,
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): { id: string; stages: () => StageGenerator }[] {
    const result = [];
    for (const operationId of config.operationId) {
      const schemeName = getSchemeNameByOperationId(spec, operationId);
      const credential = getVaultCredential(vault, schemeName);
      const credentials = truncatedThree(credential);
      for (const credential of credentials) {
        const credentialString = basicCredentialToString(credential);
        result.push({
          id: `password: ${credential.password} for ${operationId}`,
          stages: () => tryCredentialGenerator(operationId, credentialString),
        });
      }
    }

    return result;
  },
};

/*
const weakPasswords: Test = {
  requirements: [["must-have-valid-basic-auth-credentials", hasValidBasicAuthCredentials]],
  // output: returns username: with "password" as password and username: with $username as password
  // generate(value: string): string[] {
  //   const { username } = parseBasicAuth(value);
  //   return [`${username}:password`, `${username}:$username`];
  // },

  // run1: function () {
  //   const response = operation("userinfo");
  //   if (response.status === 200) {
  //     return { failed: "Expected authentication to fail with weak password" };
  //   }
  // },

  run: function (config: TestConfiguration): { id: string; stages: () => StageGenerator }[] {
    return [{ id: "zomg", stages: () => operation("userinfo") }];
  },
};

const weakPasswords2: Test = {
  requirements: [["must-have-valid-basic-auth-credentials", hasValidBasicAuthCredentials]],
  // output: returns username: with "password" as password and username: with $username as password
  // generate(value: string): string[] {
  //   const { username } = parseBasicAuth(value);
  //   return [`${username}:password`, `${username}:$username`];
  // },

  run: function (config: TestConfiguration): { id: string; stages: () => StageGenerator }[] {
    return [
      {
        id: "password: foo",
        stages: async function* (): StageGenerator {
          yield {
            stage: { ref: { type: "operation", id: "userinfo" } },
            hooks: {
              security: async function* (auth) {
                return {
                  basic: {
                    credential: { type: "basic", default: "", methods: {} },
                    value: "foo:bar",
                  },
                };
              },
              response: async function* (response) {
                console.log("Response in weakPasswords test:", response);
                yield { event: "test-failed", message: "Test failed as expected" };
                return response;
              },
            },
          };
        },
      },
      {
        id: "password: bar",
        stages: async function* (): StageGenerator {
          yield {
            stage: { ref: { type: "operation", id: "userinfo" } },
            hooks: {
              security: async function* (auth) {
                return {
                  basic: {
                    credential: { type: "basic", default: "", methods: {} },
                    value: "foo:bar",
                  },
                };
              },
              response: async function* (response) {
                console.log("Response in weakPasswords test:", response);
                yield { event: "test-failed", message: "Test failed as expected" };
                return response;
              },
            },
          };
        },
      },
    ];
  },
};
*/

/*
const changeUsernameCase: Test = {
  id: "change-username-case",
  requirements: [["must-have-valid-basic-auth-credentials", hasValidBasicAuthCredentials]],
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
  execute: dummyExecutor,
};

const changePasswordCase: Test = {
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
  execute: dummyExecutor,
};

const truncatePassword: Test = {
  id: "truncate-password",
  requirements: [["must-have-valid-basic-auth-credentials", hasValidBasicAuthCredentials]],

  generate: (value: string): string[] => {
    // TODO: truncate password
    return [];
  },
  execute: dummyExecutor,
};

*/

function parseBasicAuth(value: string): { username: string; password: string } {
  const [username, password] = value.split(":");
  return { username, password };
}

const suite: Suite = {
  description: "A suite of tests for Basic Authentication.",
  requirements: { usesBasicAuth },

  tests: {
    //weakPasswords,
    truncatedPasswordsTest,
    //weakPasswords2 /*changeUsernameCase, changePasswordCase, truncatePassword*/,
  },
};

// TODO: test, truncate long password -- needs password longer that 16 chars in vault.
// etc etc

async function* operation(id: string): StageGenerator {
  yield {
    stage: { ref: { type: "operation", id } },
    hooks: {
      security: async function* (auth) {
        return {
          basic: {
            credential: { type: "basic", default: "", methods: {} },
            value: "foo:bar",
          },
        };
      },
      response: async function* (response) {
        yield { event: "test-failed", message: "Failed" };
        return response;
      },

      error: async function* (error) {
        yield { event: "test-failed", message: "Unexpected http error" };
        return error;
      },
    },
  };
}

async function* tryCredentialGenerator(operationId: string, credential: string): StageGenerator {
  yield {
    stage: { ref: { type: "operation", id: operationId } },
    hooks: {
      security: async function* (auth) {
        return {
          basic: {
            credential: { type: "basic", default: "", methods: {} },
            value: credential,
          },
        };
      },
      response: async function* (response) {
        //yield { event: "test-failed", message: "Failed 1" };
        return response;
      },

      error: async function* (error) {
        yield { event: "test-failed", message: "Unexpected http error" };
        return error;
      },
    },
  };
}

function getSchemeNameByOperationId(spec: BundledSwaggerOrOasSpec, operationId: string) {
  const result = getOperationById(spec, operationId);
  if (result === undefined) {
    throw new Error(`Operation with id "${operationId}" not found / FIXME`);
  }
  const security = result.operation.security ?? spec.security ?? [];
  // just grab the first one, FIXME
  return Object.keys(security[0])[0];
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

export default suite;
