import { assert, expect, test } from "vitest";
import { formatBody } from "../src/foo";

test("makeBody - application/json", () => {
  const body = { mediaType: "application/json", value: { foo: "bar" } };
  const result = formatBody(body, null as any, null as any);
  assert.deepEqual(JSON.parse(result as string), body.value);
});
