// import {
//   BundledSwaggerOrOasSpec,
//   deref,
//   getOperations,
//   OpenApi30,
//   OpenApi31,
//   Swagger,
// } from "@xliic/openapi";
// import { Result } from "@xliic/result";
// import {
//   ApiKeySecurityScheme,
//   BasicSecurityScheme,
//   Vault,
//   SecurityScheme as VaultSecurityScheme,
// } from "@xliic/common/vault";
// import { Test, TestExecutor, TestSuite } from "./types";

// const dummyExecutor: TestExecutor = async function* (client, oas, playbook, vault, test, config) {
//   yield { event: "playbook-started", name: `${test.id}` };
//   yield { event: "playbook-finished" };
// };

// function getSecuritySchemes(spec: BundledSwaggerOrOasSpec) {
//   return ("swagger" in spec ? spec.securityDefinitions : spec.components?.securitySchemes) ?? {};
// }

// function getActiveSecuritySchemes(spec: BundledSwaggerOrOasSpec) {
//   const result: Record<
//     string,
//     Swagger.SecurityScheme | OpenApi30.SecurityScheme | OpenApi31.SecurityScheme
//   > = {};
//   const operations = getOperations(spec);
//   for (const [, , operation] of operations) {
//     const security = operation.security ?? spec.security ?? [];
//     for (const entry of security) {
//       for (const name of Object.keys(entry)) {
//         const schemeOrRef =
//           "swagger" in spec
//             ? spec.securityDefinitions?.[name]
//             : spec.components?.securitySchemes?.[name];
//         const scheme = deref(spec, schemeOrRef);
//         if (scheme) {
//           result[name] = scheme;
//         }
//       }
//     }
//   }

//   return result;
// }

// function matchSchemesToVault(spec: BundledSwaggerOrOasSpec, vault: Vault): string[] {
//   const errors: string[] = [];
//   const schemes = getSecuritySchemes(spec);
//   for (const [name, scheme] of Object.entries(schemes)) {
//     const vaultScheme = vault.schemes[name];
//     // check if vaultScheme matches scheme
//     if (vaultScheme === undefined) {
//       errors.push(`Missing vault scheme for security scheme "${name}"`);
//     } else if (!checkVaultSchemeType(vaultScheme, scheme)) {
//       errors.push(`Mismatched or missing vault scheme for security scheme "${name}"`);
//     }
//   }

//   return errors;
// }

// function matchActiveSchemesToVault(
//   spec: BundledSwaggerOrOasSpec,
//   vault: Vault
// ): Result<Record<string, VaultSecurityScheme | undefined>, string[]> {
//   const result: Record<string, VaultSecurityScheme | undefined> = {};
//   const errors: string[] = [];
//   const activeSchemes = getActiveSecuritySchemes(spec);
//   for (const [name, scheme] of Object.entries(activeSchemes)) {
//     const vaultScheme = vault.schemes[name];
//     // check if vaultScheme matches scheme
//     if (vaultScheme !== undefined && checkVaultSchemeType(vaultScheme, scheme)) {
//       result[name] = vaultScheme;
//     } else {
//       result[name] = undefined;
//       //errors.push(`Mismatched or missing vault scheme for security scheme "${name}"`);
//     }
//   }

//   if (errors.length > 0) {
//     return [undefined, errors];
//   }

//   return [result, undefined];
// }

// function checkVaultSchemeType(
//   vaultScheme: VaultSecurityScheme,
//   scheme: Swagger.SecurityScheme | OpenApi30.SecurityScheme | OpenApi31.SecurityScheme
// ): boolean {
//   if (scheme.type === "apiKey" && vaultScheme.type === "apiKey") {
//     return true;
//   }
//   return false;
// }

// function usesApiKeyAuth(spec: BundledSwaggerOrOasSpec, vault: Vault): string[] {
//   const activeSchemes = getActiveSecuritySchemes(spec);
//   for (const scheme of Object.values(activeSchemes)) {
//     if (scheme.type === "apiKey") {
//       return [];
//     }
//   }
//   return ["No operations using API Key schemes found"];
// }

// function hasValidApiKeyAuthCredentials(spec: BundledSwaggerOrOasSpec, vault: Vault): string[] {
//   const [schemes, errors] = matchActiveSchemesToVault(spec, vault);
//   if (errors !== undefined) {
//     return errors;
//   }

//   const apiKeySchemes: Record<string, ApiKeySecurityScheme> = {};

//   for (const name of Object.keys(schemes)) {
//     const vaultScheme = schemes[name];
//     if (vaultScheme?.type === "apiKey") {
//       apiKeySchemes[name] = vaultScheme;
//     }
//   }

//   if (Object.keys(apiKeySchemes).length === 0) {
//     return ["No matching Vault API Key Auth schemes found"];
//   }

//   const schemesWithNoCredentials: string[] = [];
//   for (const name of Object.keys(apiKeySchemes)) {
//     const vaultScheme = apiKeySchemes[name];
//     if (Object.keys(vaultScheme.credentials).length === 0) {
//       schemesWithNoCredentials.push(
//         `No credentials found in vault for API Key Auth scheme "${name}"`
//       );
//     }
//   }

//   return schemesWithNoCredentials;
// }

// const changeApiKeyCase: Test = {
//   id: "change-api-key-case",
//   requirements: [["must-have-valid-api-key-auth-credentials", hasValidApiKeyAuthCredentials]],

//   generate: (value: string): string[] => {
//     const { username, password } = parseBasicAuth(value);

//     const upcased = `${username}:${password.toUpperCase()}`;
//     if (upcased !== value) {
//       return [upcased];
//     }

//     const downcased = `${username}:${password.toLowerCase()}`;
//     if (downcased !== value) {
//       return [downcased];
//     }

//     return [];
//   },
//   execute: dummyExecutor,
// };

// const truncateApiKey: Test = {
//   id: "truncate-api-key",
//   requirements: [["must-have-valid-api-key-auth-credentials", hasValidApiKeyAuthCredentials]],

//   generate: (value: string): string[] => {
//     // TODO: truncate password
//     return [];
//   },
//   execute: dummyExecutor,
// };

// function parseBasicAuth(value: string): { username: string; password: string } {
//   const [username, password] = value.split(":");
//   return { username, password };
// }

// const suite: TestSuite = {
//   id: "api-key-test-suite",
//   description: "A suite of tests for API Key Authentication.",
//   requirements: [["must-use-api-key", usesApiKeyAuth]],

//   tests: [changeApiKeyCase, truncateApiKey],
// };

// export default suite;
