import assert from "assert";
import { getArticles } from "../../audit/client";
import * as quickfixes from "../../generated/quickfixes.json";

suite("Quickfix keys", () => {
  test("Make sure quickfix keys exits in KDB and are not deprecated", async () => {
    const articles = await getArticles(true); // useDevEndpoints
    const missing = new Set<string>();
    const deprecated = new Set<string>();
    for (const fix of quickfixes.fixes) {
      for (const problemId of fix.problem) {
        if (!articles[problemId]) {
          missing.add(problemId);
        } else if (articles[problemId].shortDescription.includes("deprecated")) {
          deprecated.add(problemId);
        }
      }
    }
    // must not have missing keys
    assert.deepStrictEqual(Array.from(missing), []);
    // must not use deprecated keys
    assert.deepStrictEqual(Array.from(deprecated), []);
  });

  test("Make sure quickfix keys exits in KDB and are not deprecated", async () => {
    const articles = await getArticles(true); // useDevEndpoints
    const ids = [
      "schema-request-notype",
      "schema-response-notype",
      "v3-schema-request-notype",
      "v3-schema-response-notype",
      "response-schema-undefined",
      "v3-mediatype-request-schema-undefined",
      "v3-mediatype-response-schema-undefined",
    ];
    for (const id of ids) {
      assert.ok(articles[id], `KDB key '${id}' must be defined`);
      assert.ok(
        !articles[id].shortDescription.includes("deprecated"),
        `KDB key '${id}' must not be deprecated`
      );
    }
  });
});
