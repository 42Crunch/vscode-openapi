import { afterAll, beforeAll, test, expect } from "vitest";

import { parsePlaybook, runSuite } from "./util";
import { start, stop } from "./server";
import { configure } from "../index";
import basicSecurityRequirements from "../security-requirements";

import oas from "./basic-security-requirements/oas.json";
import vault from "./basic-security-requirements/vault.json";
import scanconf from "./basic-security-requirements/scanconf.json";
import { is } from "zod/v4/locales";

let port: number;

beforeAll(async () => {
  port = await start(undefined);
});

afterAll(stop);

test("execute basic security requirements test suite", async () => {
  const file = parsePlaybook(oas, scanconf);
  const config = await configure(oas as any, file, vault as any);

  const basicSecReq = config.basicSecurityRequirements;

  const { issues, steps } = await runSuite(
    `http://localhost:${port}`,
    oas,
    file,
    basicSecurityRequirements,
    basicSecReq,
    undefined,
    vault as any
  );

  // expecting one issue "security-requirements-not-enforced"
  expect(issues.length).toBe(1);
});
