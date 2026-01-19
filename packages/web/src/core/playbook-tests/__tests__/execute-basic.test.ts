import { afterAll, beforeAll, test, expect } from "vitest";

import { parseScenario, runScenario } from "./util";
import { start, stop } from "./server";

import oas from "./basic/oas.json";
import vault from "./basic/vault.json";
import scanconf from "./basic/scanconf";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute get user info basic", async () => {
  const file = parseScenario(oas, scanconf);
  const steps = await runScenario(
    `http://localhost:${port}`,
    oas,
    file,
    "userinfoBasic",
    undefined,
    vault as any
  );
  expect(steps.length).toBe(13);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});
