import { afterAll, beforeAll, test } from "vitest";

import oas from "./pixi.json";
import scenario from "./scenario-external";
import { makeStepAssert, parseScenario, runScenario } from "./util";
import { start, stop } from "./server";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute external", async () => {
  const file = parseScenario(oas, scenario(port));
  const steps = await runScenario(`http://localhost:${port}`, oas, file, "userinfo");
  const step = makeStepAssert(steps);

  step({
    event: "playbook-started",
    name: "test",
  });

  step({
    event: "request-started",
    ref: { type: "request", id: "external" },
  });

  step({
    event: "payload-variables-substituted",
  });

  step({
    event: "external-http-request-prepared",
  });

  step({
    event: "http-response-received",
    response: { statusCode: 200 },
  });

  step({
    event: "variables-assigned",
  });

  step({
    event: "variables-assigned",
  });

  step({
    event: "request-started",
    ref: { type: "operation", id: "userinfo" },
  });

  step({
    event: "payload-variables-substituted",
  });

  step({
    event: "http-request-prepared",
  });

  step({
    event: "http-response-received",
    response: { statusCode: 200 },
  });

  step({
    event: "variables-assigned",
  });

  step({
    event: "variables-assigned",
  });

  step({
    event: "playbook-finished",
  });
});
