import { afterAll, beforeAll, test, expect } from "vitest";

import { parseScenario, runScenario } from "./util";
import { start, stop } from "./server";

import oas from "./basic-flow/oas.json";
import vault from "./basic-flow/vault.json";
import scenario from "./basic-flow/scenario";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute getPosts", async () => {
  const file = parseScenario(oas, scenario);
  const steps = await runScenario(
    `http://localhost:${port}`,
    oas,
    file,
    "getPosts",
    undefined,
    vault as any
  );
  expect(steps.length).toBe(13);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});

test("execute createPost", async () => {
  const file = parseScenario(oas, scenario);
  const steps = await runScenario(
    `http://localhost:${port}`,
    oas,
    file,
    "createPost",
    undefined,
    vault as any
  );
  expect(steps.length).toBe(13);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});

test("execute getPost", async () => {
  const file = parseScenario(oas, scenario);
  const steps = await runScenario(
    `http://localhost:${port}`,
    oas,
    file,
    "getPost",
    undefined,
    vault as any
  );
  expect(steps.length).toBe(35);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});

test("execute deletePost", async () => {
  const file = parseScenario(oas, scenario);
  const steps = await runScenario(
    `http://localhost:${port}`,
    oas,
    file,
    "deletePost",
    undefined,
    vault as any
  );
  expect(steps.length).toBe(24);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});
