import { afterAll, beforeAll, test } from "vitest";

import oas from "./pixi-no-header.json";
import scenarioAuth from "./scenario-auth";
import { makeStepAssert, parseScenario, runScenario } from "./util";
import { start, stop } from "./server";
import { testPlaybook } from "../authn-tests";
import { httpClient } from "./httpclient";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute auth", async () => {
  const file = parseScenario(oas, scenarioAuth);

  const result = testPlaybook(
    ["test", "userinfo"],
    httpClient,
    oas as any,
    `http://localhost:${port}`,
    file,
    [{ name: "test", requests: file.operations["userinfo"].scenarios[0].requests }],
    { default: {}, secrets: {} },
    []
  );

  for await (const step of result) {
    //console.log(step);
  }
});
