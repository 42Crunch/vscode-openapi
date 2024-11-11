import { Path, findByPath } from "@xliic/preserving-json-yaml-parser";

import { VariableLocation } from "@xliic/common/env";

export const DynamicVariableNames = [
  "$randomString",
  "$randomuint",
  "$uuid",
  "$timestamp",
  "$timestamp3339",
  "$randomFromSchema",
] as const;

export type DynamicVariableName = (typeof DynamicVariableNames)[number];

export type FakeMaker = () => { body: unknown; parameters: unknown };

export const DynamicVariables: Record<
  DynamicVariableName,
  (object: unknown, location: VariableLocation, fakerMaker: FakeMaker) => void
> = {
  $randomString: () => generateRandomString(20),
  $randomuint: () => getRandomUint32(),
  $uuid: () => crypto.randomUUID(),
  $timestamp: () => generateTimestamp(),
  $timestamp3339: () => generateIsoTimestamp(),
  $randomFromSchema: randomFromSchema,
};

function randomFromSchema(
  object: unknown,
  location: VariableLocation,
  fakerMaker: FakeMaker
): unknown {
  const fake = fakerMaker();
  if (location.path[0] == "body" && location.path[1] === "value") {
    return findByPath(fake.body as any, location.path.slice(2));
  } else if (location.path[0] === "parameters") {
    const name = findByPath(object as any, [...location.path.slice(0, -1), "key"]);
    return (fake.parameters as any)[location.path[1]][name];
  }
}

function generateRandomString(length: number) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomValues[i] % characters.length);
  }

  return result;
}

function generateTimestamp() {
  const now = new Date();
  return Math.floor(now.getTime() / 1000);
}

function generateIsoTimestamp() {
  const now = new Date();
  return now.toISOString();
}

function getRandomUint32() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}
