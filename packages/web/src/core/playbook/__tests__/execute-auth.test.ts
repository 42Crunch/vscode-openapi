import { afterAll, beforeAll, test } from "vitest";

import oas from "./pixi-no-header.json";
import scenarioAuth from "./scenario-auth";
import { makeStepAssert, parseScenario, runScenario } from "./util";
import { start, stop } from "./server";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute auth", async () => {
  const file = parseScenario(oas, scenarioAuth);
  const { steps } = await runScenario(`http://localhost:${port}`, oas, file, "userinfo");
  const step = makeStepAssert(steps);

  step({
    event: "playbook-started",
    name: "test",
  });

  step({
    event: "request-started",
    ref: { type: "operation", id: "userinfo" },
  });

  step({
    event: "auth-started",
    name: "access-token",
  });

  step({
    event: "playbook-started",
    name: "access-token",
  });

  step({
    event: "request-started",
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

  step({
    event: "credential-variables-substituted",
  });

  step({
    event: "auth-finished",
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
