import { afterAll, beforeAll, expect, test } from "vitest";
import oas from "./pixi.json";
import scenarioSimple from "./scenario-simple";
import { makeStepAssert, parseScenario, runPlaybooks } from "./util";
import { start, stop } from "./server";
import { PlaybookList, StageGenerator } from "../execute";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute generator", async () => {
  const file = parseScenario(oas, scenarioSimple);

  const generator = async function* (): StageGenerator {
    yield {
      stepId: "step-1",
      step: {
        ref: { type: "operation", id: "register" },
      },
    };
    yield {
      stepId: "step-2",
      step: {
        ref: { type: "operation", id: "userinfo" },
      },
    };
  };

  const steps = await runPlaybooks(`http://localhost:${port}`, oas, file, [
    { name: "test", requests: [generator()] },
  ]);

  expect(steps.length).toBeGreaterThan(0);

  const steps2 = await runPlaybooks(`http://localhost:${port}`, oas, file, [
    { name: "test", requests: [generator(), generator()] },
  ]);

  expect(steps2.length).toBe(steps.length * 2 - 2); // minus playbook-started and playbook-finished
});
