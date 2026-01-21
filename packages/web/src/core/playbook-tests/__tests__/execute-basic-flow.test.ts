import { afterAll, beforeAll, test, expect } from "vitest";

import { runScenario2 } from "./util";
import { start, stop } from "./server";

import oas from "./basic-flow/oas.json";
import vault from "./basic-flow/vault.json";
import scanconf from "./basic-flow/scanconf.json";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute getPosts", async () => {
  const steps = await runScenario2(port, oas, scanconf, vault, "getPosts");
  expect(steps.length).toBe(13);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});

test("execute createPost", async () => {
  const steps = await runScenario2(port, oas, scanconf, vault, "createPost");
  expect(steps.length).toBe(13);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});

test("execute getPost", async () => {
  const steps = await runScenario2(port, oas, scanconf, vault, "getPost");
  expect(steps.length).toBe(24);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});

test("execute deletePost", async () => {
  const steps = await runScenario2(port, oas, scanconf, vault, "deletePost");
  expect(steps.length).toBe(24);
  expect(steps.at(-1)).toMatchObject({ event: "playbook-finished" });
});
