import { afterAll, beforeAll, expect, test } from "vitest";

import { parseScenario } from "./util";
import { testPlaybook } from "../authn-tests";
import { httpClient } from "./httpclient";

import oas from "./identity/pixi-userinfo-auth.json";
import scenarioAuth from "./identity/scenario-identity-tests";
import { start, stop } from "./identity/server";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute identity tests/token", async () => {
  const file = parseScenario(oas, scenarioAuth);

  const result = testPlaybook(
    ["test", "userinfoToken"],
    httpClient,
    oas as any,
    `http://localhost:${port}`,
    file,
    [{ name: "test", requests: file.operations["userinfoToken"].scenarios[0].requests }],
    { default: {}, secrets: {} },
    []
  );

  while (true) {
    const { value, done } = await result.next();
    if (done) {
      expect(value.length).toBe(1);
      break;
    } else {
      //console.log(value);
    }
  }
});

test("execute identity tests/basic", async () => {
  const file = parseScenario(oas, scenarioAuth);

  const result = testPlaybook(
    ["test", "userinfoBasic"],
    httpClient,
    oas as any,
    `http://localhost:${port}`,
    file,
    [{ name: "test", requests: file.operations["userinfoBasic"].scenarios[0].requests }],
    { default: {}, secrets: {} },
    []
  );

  while (true) {
    const { value, done } = await result.next();
    if (done) {
      expect(value.length).toBe(1);
      break;
    } else {
      //console.log(value);
    }
  }
});
