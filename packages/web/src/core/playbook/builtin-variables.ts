import { PlaybookEnv } from "./playbook-env";

export function createDynamicVariables(): PlaybookEnv {
  const random = Math.floor(Math.random() * 10000000);

  return {
    id: "dynamic",
    env: {
      $random: `${random}`,
      $randomFromSchema: `${random}`,
      $randomString: generateRandomString(20),
      $randomuint: getRandomUint32(),
      $uuid: crypto.randomUUID(),
      $timestamp: generateTimestamp(),
      $timestamp3339: generateIsoTimestamp(),
    },
    assignments: [],
  };
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
