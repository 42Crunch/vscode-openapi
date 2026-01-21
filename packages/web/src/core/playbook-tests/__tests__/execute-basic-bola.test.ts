import { afterAll, beforeAll, test, expect } from "vitest";

import { parsePlaybook, parseScenario, runSuite } from "./util";
import { start, stop } from "./server";
import { configure } from "../index";
import basicSuite from "..//basic";

import oas from "./basic-flow/oas.json";
import vault from "./basic-flow/vault.json";
import scanconf from "./basic-flow/scanconf.json";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute basic auth test suite", async () => {
  const file = parsePlaybook(oas, scanconf);
  const config = await configure(oas as any, file, vault as any);

  // Extract the basic suite config
  const basicBola = config.basicBola;

  console.log("Basic Bola Config:", basicBola);

  const steps = await runSuite(
    `http://localhost:${port}`,
    oas,
    file,
    basicSuite,
    basicBola,
    undefined,
    vault as any
  );

  console.log(steps);

  // Verify we got steps from the test execution
  //expect(steps.length).toBeGreaterThan(0);

  // Check for playbook execution steps
  //const playbookSteps = steps.filter((s: any) => s.event !== undefined);
  //expect(playbookSteps.length).toBeGreaterThan(0);

  // Verify the test executed successfully
  //expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});
