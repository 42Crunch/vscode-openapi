import { expect, test, assert } from "vitest";

import { serialize } from "../src/index";

import oas from "./pixi/pixi.json";
import scanconf from "./pixi/scanconf.json";
import { parseScenario } from "./util";

test("parse and serialize", async () => {
  const file = parseScenario(oas, scanconf as any);

  const [serialized, serializeError] = serialize(oas as any, file);

  if (serializeError !== undefined) {
    assert.fail("Error serializing config");
    return;
  }

  expect(JSON.parse(JSON.stringify(serialized))).toEqual(scanconf);
});
