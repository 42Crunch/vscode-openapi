import { expect, test, assert } from "vitest";

import { parse } from "../scanconf-parser";
import { serialize } from "../scanconf-serializer";

import oas from "./pixi/pixi.json";
import scanconf from "./pixi/scanconf.json";

test("parse and serialize", async () => {
  const [parsed, parseError] = parse(oas as any, scanconf as any);

  //console.log("operations", JSON.stringify(parsed?.operations["register"], null, 2));

  if (parseError !== undefined) {
    assert.fail("Error parsing config");
    return;
  }

  const [serialized, serializeError] = serialize(oas as any, parsed);

  if (serializeError !== undefined) {
    assert.fail("Error serializing config");
    return;
  }

  expect(JSON.parse(JSON.stringify(serialized))).toEqual(scanconf);
});
