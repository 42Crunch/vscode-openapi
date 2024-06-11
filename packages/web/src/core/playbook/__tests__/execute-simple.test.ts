import { expect, test } from "vitest";
import oas from "./pixi.json";
import scenarioSimple from "./scenario-simple";
import { makeStepAssert, parseScenario, runScenario } from "./util";

test("execute simple", async () => {
  const file = parseScenario(oas, scenarioSimple);
  const steps = await runScenario(oas, file, "userinfo");
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
        context: { type: "built-in" },
        name: "$randomuint",
        location: { type: "request", path: ["body", "value", "name"] },
      },
      {
        context: { type: "built-in" },
        name: "$randomuint",
        location: { type: "request", path: ["body", "value", "user"] },
      },
    ],
    missing: [],
  });

  step({
    event: "http-request-prepared",
    request: {
      method: "post",
      body: expect.stringContaining("foo"),
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
          { name: "username", value: expect.stringContaining("foo") },
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
        context: {
          name: "test",
          responseCode: "200",
          step: 0,
          type: "playbook-request",
        },
        location: {
          path: ["parameters", "header", 0, "value"],
          type: "request",
        },
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
