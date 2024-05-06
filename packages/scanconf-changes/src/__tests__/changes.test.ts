import { expect, test } from "vitest";
import { Scanconf } from "@xliic/scanconf";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { compare } from "../compare";

const originalOas = (await import(
  "./oas/operation-added/original-oas.json"
)) as BundledSwaggerOrOasSpec;

const updatedOas = (await import(
  "./oas/operation-added/updated-oas.json"
)) as BundledSwaggerOrOasSpec;

const originalScanconf = (await import(
  "./oas/operation-added/original-scanconf.json"
)) as unknown as Scanconf.ConfigurationFileBundle; // FIXME scanconf seems to diverge from schema

const updatedScanconf = (await import(
  "./oas/operation-added/updated-scanconf.json"
)) as unknown as Scanconf.ConfigurationFileBundle; // FIXME scanconf seems to diverge from schema

test("compare equal", async () => {
  const changes = compare(originalOas, originalScanconf);
  expect(changes).toEqual([]);
});

test("find removed operation", async () => {
  const changes = compare(originalOas, updatedScanconf);
  expect(changes).toEqual([
    {
      operationId: "/foo:delete",
      type: "operation-removed",
      method: "delete",
      path: "/foo",
      references: [
        {
          container: "globalBefore",
          stageIndex: 0,
        },
        {
          container: "credential",
          credentialId: "foobar",
          group: 0,
          stageIndex: 0,
          subCredentialId: "foobar",
        },
        {
          container: "operationScenarios",
          operationId: "/foo:get",
          scenarioIndex: 0,
          stageIndex: 1,
        },
      ],
    },
  ]);
});

test("find added operation", async () => {
  const changes = compare(updatedOas, originalScanconf);
  expect(changes).toEqual([
    {
      operationId: "/foo:delete",
      type: "operation-added",
      path: "/foo",
      method: "delete",
    },
  ]);
});

test("find renamed operation", async () => {
  const oasWithRename = structuredClone(originalOas);
  oasWithRename.paths["/foo"]["get"]!.operationId = "zomg";
  const changes = compare(oasWithRename, originalScanconf);
  expect(changes).toEqual([
    {
      oldOperationId: "/foo:get",
      newOperationId: "zomg",
      type: "operation-renamed",
      path: "/foo",
      method: "get",
    },
  ]);
});

const updatedOas2 = (await import(
  "./oas/security-added/updated-oas.json"
)) as unknown as BundledSwaggerOrOasSpec;

const originalScanconf2 = (await import(
  "./oas/security-added/original-scanconf.json"
)) as unknown as Scanconf.ConfigurationFileBundle; // FIXME scanconf seems to diverge from schema

test("find added security", async () => {
  const changes = compare(updatedOas2, originalScanconf2);
  expect(changes).toEqual([
    { type: "security-added", schema: "access-token" },
    { type: "security-added", schema: "OAuth2" },
  ]);
});
