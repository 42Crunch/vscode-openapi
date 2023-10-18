import { test } from "vitest";
import { createDynamicVariables } from "../builtin-variables";
import oas from "./pixi.json";
import scenarioAuth from "./scenario-auth";
import { makeStepAssert, parseScenario, runScenario } from "./util";

test("execute auth", async () => {
  const file = parseScenario(oas, scenarioAuth);
  const vars = createDynamicVariables();
  const steps = await runScenario(oas, file, vars, "userinfo");
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
