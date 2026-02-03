import { findByPath } from "@xliic/preserving-json-yaml-parser";

import { Vault } from "@xliic/common/vault";
import { getAnyCredential, getCredentialByName } from "../vault";
import { Playbook } from "@xliic/scanconf";
import { Result } from "@xliic/result";
import { PlaybookVariableSubstitutionLocation } from "./playbook-env";
import { SecurityRequirement } from "@xliic/openapi";

export const DynamicVariableNames = [
  "$randomString",
  "$randomuint",
  "$uuid",
  "$timestamp",
  "$timestamp3339",
  "$randomFromSchema",
  "$vault",
  "$vault-name",
] as const;

export type DynamicVariableName = (typeof DynamicVariableNames)[number];

export type FakeMaker = () => { body: unknown; parameters: unknown };

export const DynamicVariables: Record<
  DynamicVariableName,
  (
    object: unknown,
    parameter: string | undefined,
    location: PlaybookVariableSubstitutionLocation,
    fakerMaker: FakeMaker
  ) => Result<unknown, string>
> = {
  $randomString: () => generateRandomString(20),
  $randomuint: () => getRandomUint32(),
  $uuid: () => [crypto.randomUUID(), undefined],
  $timestamp: () => generateTimestamp(),
  $timestamp3339: () => generateIsoTimestamp(),
  $randomFromSchema: randomFromSchema,
  $vault: vault,
  "$vault-name": vaultName,
};

function randomFromSchema(
  object: unknown,
  parameter: string | undefined,
  location: PlaybookVariableSubstitutionLocation,
  fakerMaker: FakeMaker
): Result<unknown, string> {
  const fake = fakerMaker();
  if (location.path[0] == "body" && location.path[1] === "value") {
    return [findByPath(fake.body as any, location.path.slice(2)), undefined];
  } else if (location.path[0] === "parameters") {
    const name = findByPath(object as any, [...location.path.slice(0, -1), "key"]);
    return [(fake.parameters as any)[location.path[1]][name], undefined];
  }
  return [undefined, `Unsupported location for $randomFromSchema variable`];
}

function generateRandomString(length: number): Result<string, string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomValues[i] % characters.length);
  }

  return [result, undefined];
}

function generateTimestamp(): Result<number, string> {
  const now = new Date();
  return [Math.floor(now.getTime() / 1000), undefined];
}

function generateIsoTimestamp(): Result<string, string> {
  const now = new Date();
  return [now.toISOString(), undefined];
}

function getRandomUint32(): Result<number, string> {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return [buffer[0], undefined];
}

function vault(
  object: unknown,
  parameter: string | undefined,
  location: PlaybookVariableSubstitutionLocation,
  fakerMaker: FakeMaker
): Result<string, string> {
  const { credentialName, credential, vault, security } = object as {
    credentialName: string;
    credential: Playbook.Credential;
    vault: Vault;
    security: SecurityRequirement[];
  };

  const [schemeCredential, schemeCredentialError] = getAnyCredential(
    vault,
    credentialName,
    security
  );

  if (schemeCredentialError !== undefined) {
    return [undefined, schemeCredentialError];
  }

  if ("key" in schemeCredential) {
    return [`${schemeCredential.key}`, undefined];
  } else if ("username" in schemeCredential && "password" in schemeCredential) {
    return [`${schemeCredential.username}:${schemeCredential.password}`, undefined];
  } else if ("token" in schemeCredential) {
    return [`${schemeCredential.token}`, undefined];
  }

  return [undefined, `Unsupported credential type for '$vault' variable`];
}

function vaultName(
  object: unknown,
  parameter: string | undefined,
  location: PlaybookVariableSubstitutionLocation,
  fakerMaker: FakeMaker
): Result<string, string> {
  const { credentialName, credential, vault } = object as {
    credentialName: string;
    credential: Playbook.Credential;
    vault: Vault;
  };

  const [schemeCredential, schemeCredentialError] = getCredentialByName(
    vault,
    credentialName,
    parameter!
  );

  if (schemeCredentialError !== undefined) {
    return [undefined, schemeCredentialError];
  }

  if ("key" in schemeCredential) {
    return [`${schemeCredential.key}`, undefined];
  } else if ("username" in schemeCredential && "password" in schemeCredential) {
    return [`${schemeCredential.username}:${schemeCredential.password}`, undefined];
  } else if ("token" in schemeCredential) {
    return [`${schemeCredential.token}`, undefined];
  }

  return [undefined, `Unsupported credential type for '$vault-name' variable`];
}
