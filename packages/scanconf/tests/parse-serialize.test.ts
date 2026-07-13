import { expect, test, assert } from "vitest";

import { serialize } from "../src/index";

import oas from "./pixi/pixi.json";
import scanconf from "./pixi/scanconf.json";
import { parseScenario } from "./util";

test("parse and serialize", async () => {
  const file = parseScenario(oas, scanconf as any);

  const [serialized, serializeError] = serialize(file);

  if (serializeError !== undefined) {
    assert.fail("Error serializing config");
  }

  expect(JSON.parse(JSON.stringify(serialized))).toEqual(scanconf);
});

test("parse and serialize securityProfile", async () => {
  const securityProfile = {
    clientCertificate: "cert",
    clientCertificatePassword: "secret",
    caServerCertificate: "ca",
  };
  const withProfile = { ...(scanconf as any), securityProfile };

  const file = parseScenario(oas, withProfile);
  expect(file.securityProfile).toEqual(securityProfile);

  const [serialized, serializeError] = serialize(file);
  if (serializeError !== undefined) {
    assert.fail("Error serializing config");
  }

  expect(JSON.parse(JSON.stringify(serialized))).toEqual(withProfile);
});
