import { test } from "vitest";
import { createDynamicVariables } from "../builtin-variables";
import oas from "./pixi.json";
import scenario from "./scenario-external";
import { makeStepAssert, parseScenario, runScenario } from "./util";

test("execute external", async () => {
  const file = parseScenario(oas, scenario);
  const vars = createDynamicVariables();
  const steps = await runScenario(oas, file, vars, "userinfo");
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
