import { expect, test } from "vitest";

import oas from "./identity/pixi-userinfo-auth.json";
import oasNoBasic from "./identity/pixi-userinfo-auth-no-basic.json";
import { configure } from "../identity-tests";

test("check identity tests config requiring basic auth", async () => {
  const result = configure(oas as any, {
    schemes: {
      basic: { type: "basic", credentials: { foo: { username: "foo", password: "bar" } } },
    },
  });
  expect(result).toEqual({
    basic: {
      failures: {
        "must-use-basic-auth": [],
      },
      tests: {
        "weak-passwords": {
          failures: [],
        },
      },
    },
  });
});

test("check identity tests config without basic auth", async () => {
  const result = configure(oasNoBasic as any, { schemes: {} });
  expect(result).toEqual({
    basic: {
      failures: {
        "must-use-basic-auth": ["No operations using Basic Auth schemes found"],
      },
      tests: {},
    },
  });
});
