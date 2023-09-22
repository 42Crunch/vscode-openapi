import { v4 as uuidv4 } from "uuid";
import { Path, findByPath } from "@xliic/preserving-json-yaml-parser";

export const DynamicVariableNames = [
  "$randomString",
  "$randomuint",
  "$uuid",
  "$timestamp",
  "$timestamp3339",
  "$randomFromSchema",
] as const;

export type DynamicVariableName = (typeof DynamicVariableNames)[number];

export type FakeMaker = (location: Path) => { body: unknown; parameters: unknown };

export const DynamicVariables: Record<
  DynamicVariableName,
  (object: unknown, location: Path, fakerMaker: FakeMaker) => void
> = {
  $randomString: () => generateRandomString(20),
  $randomuint: () => getRandomUint32(),
  $uuid: () => uuidv4(),
  $timestamp: () => generateTimestamp(),
  $timestamp3339: () => generateIsoTimestamp(),
  $randomFromSchema: randomFromSchema,
};

function randomFromSchema(object: unknown, location: Path, fakerMaker: FakeMaker): unknown {
  const fake = fakerMaker(location);
  if (location?.[0] === "body" && location?.[1] === "value") {
    return findByPath(fake.body as any, location.slice(2)); // trim body, value
  } else if (location[0] === "parameters") {
    const name = findByPath(object as any, [...location.slice(0, -1), "key"]);
    return (fake.parameters as any)[location[1]][name];
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
