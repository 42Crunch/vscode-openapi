import { expect, test } from "vitest";
import { Scanconf } from "@xliic/scanconf";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { update } from "../update";
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

test("update by adding an operation", async () => {
  expect(compare(updatedOas, originalScanconf)).toEqual([
    {
      operationId: "/foo:delete",
      type: "operation-added",
      path: "/foo",
      method: "delete",
    },
  ]);

  const patchedScanconf = update(updatedOas, originalScanconf, updatedScanconf, [
    {
      type: "operation-added",
      operationId: "/foo:delete",
      path: "/foo",
      method: "delete",
    },
  ]);

  expect(compare(updatedOas, patchedScanconf)).toHaveLength(0);
});

test("update by removing an operation", async () => {
  expect(compare(originalOas, updatedScanconf)).toEqual([
    {
      operationId: "/foo:delete",
      type: "operation-removed",
      path: "/foo",
      method: "delete",
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

  const patchedScanconf = update(updatedOas, updatedScanconf, originalScanconf, [
    {
      type: "operation-removed",
      operationId: "/foo:delete",
      path: "/foo",
      method: "delete",
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

  expect(compare(originalOas, patchedScanconf)).toHaveLength(0);
});

const updatedOas2 = (await import(
  "./oas/security-added/updated-oas.json"
)) as unknown as BundledSwaggerOrOasSpec;

const originalScanconf2 = (await import(
  "./oas/security-added/original-scanconf.json"
)) as unknown as Scanconf.ConfigurationFileBundle; // FIXME scanconf seems to diverge from schema

const updatedScanconf2 = (await import(
  "./oas/security-added/updated-scanconf.json"
)) as unknown as Scanconf.ConfigurationFileBundle; // FIXME scanconf seems to diverge from schema

test("update by adding security", async () => {
  const patchedScanconf = update(updatedOas2, originalScanconf2, updatedScanconf2, [
    { type: "security-added", schema: "access-token" },
    { type: "security-added", schema: "OAuth2" },
  ]);
  expect(compare(updatedOas2, patchedScanconf)).toHaveLength(0);
});
