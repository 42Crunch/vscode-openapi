import { expect, test } from "vitest";
import { createDynamicVariables } from "../builtin-variables";
import oas from "./pixi.json";
import scenarioSimple from "./scenario-simple";
import { makeStepAssert, parseScenario, runScenario } from "./util";

test("execute simple", async () => {
  const file = parseScenario(oas, scenarioSimple);
  const vars = createDynamicVariables();
  const steps = await runScenario(oas, file, vars, "userinfo");
  const step = makeStepAssert(steps);

  step({
    event: "playbook-started",
    name: "test",
  });

  step({
    event: "request-started",
    ref: { type: "operation", id: "register" },
  });

  step({
    event: "payload-variables-substituted",
    found: [
      {
        context: "dynamic",
        name: "$random",
      },
      {
        context: "dynamic",
        name: "$random",
      },
    ],
    missing: [],
  });

  step({
    event: "http-request-prepared",
    request: {
      method: "post",
      body: expect.stringContaining(`foo${vars.env.$random}`), // var substitution worked
    },
  });

  step({
    event: "http-response-received",
    response: { statusCode: 200, body: expect.stringContaining("Token is a header JWT") },
  });

  step({
    event: "variables-assigned",
    assignments: [
      {
        assignments: [
          { name: "username", value: `foo${vars.env.$random}@company.co.uk` },
          { name: "password", value: "1afNp3FXC" },
          {
            name: "token",
          },
        ],
      },
    ],
  });

  step({
    event: "variables-assigned",
  });

  step({ event: "request-started", ref: { type: "operation", id: "userinfo" } });

  step({
    event: "payload-variables-substituted",
    found: [
      {
        context: "playbook-test-step-0-request-200",
        name: "token",
      },
    ],
    missing: [],
  });

  step({
    event: "http-request-prepared",
  });

  step({
    event: "http-response-received",
    response: { statusCode: 200, body: expect.stringContaining("Account_balance") },
  });

  step({
    event: "variables-assigned",
    assignments: [
      {
        assignments: [],
      },
    ],
  });

  step({
    event: "variables-assigned",
  });

  step({
    event: "playbook-finished",
  });
});
