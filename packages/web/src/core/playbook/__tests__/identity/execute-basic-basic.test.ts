import { afterAll, beforeAll, test, expect } from "vitest";

import { parseScenario, runSuite } from "../util";
import { start, stop } from "./server";
import { configure } from "../../identity-tests";
import basicSuite from "../../identity-tests/basic";

import oas from "./basic/oas.json";
import vault from "./basic/vault.json";
import scanconf from "./basic/scanconf";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute basic auth test suite", async () => {
  const file = parseScenario(oas, scanconf);
  const config = configure(oas as any, file, vault as any);

  // Extract the basic suite config
  const basicConfig = config.basic;

  const steps = await runSuite(
    `http://localhost:${port}`,
    oas,
    file,
    basicSuite,
    basicConfig,
    undefined,
    vault as any
  );

  // Verify we got steps from the test execution
  expect(steps.length).toBeGreaterThan(0);

  // Check for playbook execution steps
  const playbookSteps = steps.filter((s: any) => s.event !== undefined);
  expect(playbookSteps.length).toBeGreaterThan(0);

  // Verify the test executed successfully
  //expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});
