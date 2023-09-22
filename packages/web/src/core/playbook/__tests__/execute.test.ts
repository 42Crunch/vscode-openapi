import { expect, test, assert } from "vitest";

import { executeAllPlaybooks } from "../execute";
import { parse } from "../scanconf-parser";

import { HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";

import { Result } from "@xliic/common/result";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { executeHttpRequest } from "./httpclient";
import { randomInt } from "crypto";

import oas from "./pixi.json";
import scenarioSimple from "./scenario-simple";
import scenarioAuth from "./scenario-auth";
import { PlaybookEnvStack } from "../playbook-env";

test("executePlaybook()", async () => {
  const random = randomInt(10000000);

  const env: PlaybookEnvStack = [
    {
      id: "functions",
      env: {
        $random: `${random}`,
      },
      assignments: [],
    },
  ];

  const steps = [];

  const [file, error] = parse(oas as unknown as BundledSwaggerOrOasSpec, scenarioSimple);

  if (error !== undefined) {
    assert.fail("Error parsing config");
  }

  for await (const step of executeAllPlaybooks(
    httpClient,
    oas as unknown as BundledSwaggerOrOasSpec,
    "http://localhost:8090",
    file,
    {
      default: {},
      secrets: {},
    },
    env,
    [["test", file.operations["userinfo"].scenarios[0].requests]]
  )) {
    steps.push(step);
  }

  expect(steps.shift()).toMatchObject({
    event: "playbook-started",
    name: "test",
  });

  expect(steps.shift()).toMatchObject({
    event: "request-started",
  });

  expect(steps.shift()).toMatchObject({
    event: "payload-variables-substituted",
    found: [
      {
        context: "functions",
        name: "$random",
      },
      {
        context: "functions",
        name: "$random",
      },
    ],
    missing: [],
  });

  expect(steps.shift()).toMatchObject({
    event: "http-request-prepared",
    request: {
      method: "post",
      body: expect.stringContaining(`foo${random}`), // var substitution worked
    },
  });

  expect(steps.shift()).toMatchObject({
    event: "http-response-received",
    response: { statusCode: 200, body: expect.stringContaining("Token is a header JWT") },
  });

  expect(steps.shift()).toMatchObject({
    event: "variables-assigned",
    assignments: [
      {
        assignments: [
          { name: "username", value: `foo${random}@company.co.uk` },
          { name: "password", value: "1afNp3FXC" },
          {
            name: "token",
          },
        ],
      },
    ],
  });

  expect(steps.shift()).toMatchObject({ event: "variables-assigned" });

  expect(steps.shift()).toMatchObject({
    event: "request-started",
  });

  expect(steps.shift()).toMatchObject({
    event: "payload-variables-substituted",
    found: [
      {
        context: "playbook-test-step-0-request-200",
        name: "token",
      },
    ],
    missing: [],
  });

  expect(steps.shift()).toMatchObject({ event: "http-request-prepared" });

  expect(steps.shift()).toMatchObject({
    event: "http-response-received",
    response: { statusCode: 200, body: expect.stringContaining("Account_balance") },
  });

  expect(steps.shift()).toMatchObject({
    event: "variables-assigned",
    assignments: [
      {
        assignments: [],
      },
    ],
  });

  expect(steps.shift()).toMatchObject({ event: "variables-assigned" });

  expect(steps.shift()).toMatchObject({
    event: "playbook-finished",
  });
});

test("executePlaybook2()", async () => {
  const random = randomInt(10000000);

  const env: PlaybookEnvStack = [
    {
      id: "functions",
      env: {
        $random: `${random}`,
      },
      assignments: [],
    },
  ];

  const [file, error] = parse(oas as unknown as BundledSwaggerOrOasSpec, scenarioAuth);

  if (error !== undefined) {
    assert.fail("Error parsing config");
  }

  const steps = [];

  for await (const step of executeAllPlaybooks(
    httpClient,
    oas as unknown as BundledSwaggerOrOasSpec,
    "http://localhost:8090",
    file,
    {
      default: {},
      secrets: {},
    },
    env,
    [["test", file.operations["userinfo"].scenarios[0].requests]]
  )) {
    steps.push(step);
  }

  expect(steps.shift()).toMatchObject({
    event: "playbook-started",
    name: "test",
  });

  expect(steps.shift()).toMatchObject({
    event: "request-started",
  });

  expect(steps.shift()).toMatchObject({
    event: "auth-started",
    name: "access-token",
  });

  expect(steps.shift()).toMatchObject({
    event: "playbook-started",
    name: "auth",
  });

  expect(steps.shift()).toMatchObject({
    event: "request-started",
  });

  expect(steps.shift()).toMatchObject({ event: "payload-variables-substituted" });

  expect(steps.shift()).toMatchObject({ event: "http-request-prepared" });

  expect(steps.shift()).toMatchObject({
    event: "http-response-received",
    response: { statusCode: 200 },
  });

  expect(steps.shift()).toMatchObject({ event: "variables-assigned" });

  expect(steps.shift()).toMatchObject({ event: "variables-assigned" });

  expect(steps.shift()).toMatchObject({ event: "playbook-finished" });

  expect(steps.shift()).toMatchObject({ event: "auth-finished" });

  expect(steps.shift()).toMatchObject({ event: "payload-variables-substituted" });

  expect(steps.shift()).toMatchObject({ event: "http-request-prepared" });

  expect(steps.shift()).toMatchObject({
    event: "http-response-received",
    response: { statusCode: 200 },
  });

  expect(steps.shift()).toMatchObject({ event: "variables-assigned" });

  expect(steps.shift()).toMatchObject({ event: "variables-assigned" });

  expect(steps.shift()).toMatchObject({ event: "playbook-finished" });
});

async function httpClient(request: HttpRequest): Promise<Result<HttpResponse, HttpError>> {
  try {
    const received = await executeHttpRequest(request);
    return [received, undefined];
  } catch (ex) {
    return [undefined, ex as HttpError];
  }
}
