import assert from "assert";
import { findJsonNodeValue, getRootAsJsonNodeValue } from "../../json-utils";
import { safeParse } from "../../util";
import { assertStrictNodeEqual, assertStrictNodesEqual } from "../utils";

suite("Parser API", () => {
  test("JSON node", () => {
    const text = '{"a": {"a1": "foo", "/a~": "baz"}, "b": ["x", 2, true]}';
    const root = safeParse(text, "json");
    assert.ok(root);

    assertStrictNodeEqual(getRootAsJsonNodeValue(root), root, "");
    assertStrictNodeEqual(findJsonNodeValue(root, ""), root, "");
    assertStrictNodeEqual(findJsonNodeValue(root, "/a/a1"), "foo", "/a/a1");
    assertStrictNodeEqual(findJsonNodeValue(root, "/a/~1a~0"), "baz", "/a/~1a~0");
    assertStrictNodeEqual(findJsonNodeValue(root, "/b/0"), "x", "/b/0");
    assertStrictNodeEqual(findJsonNodeValue(root, "/b/1"), 2, "/b/1");
    assertStrictNodeEqual(findJsonNodeValue(root, "/b/2"), true, "/b/2");

    assert.ok(findJsonNodeValue(root, "/a").isObject());
    assert.ok(findJsonNodeValue(root, "/b").isArray());
    assert.ok(findJsonNodeValue(root, "/a/a1").isScalar());

    const children = getRootAsJsonNodeValue(root).getChildren(true);
    assert.ok(children.length === 2);

    assertStrictNodesEqual(children[0].next(root).prev(root), children[0]);
    assertStrictNodesEqual(children[1].prev(root).next(root), children[1]);
    assertStrictNodesEqual(children[0].next(root), children[1]);
    assertStrictNodesEqual(children[0], children[1].prev(root));

    assertStrictNodesEqual(getRootAsJsonNodeValue(root).getFirstChild(), children[0]);
    assertStrictNodesEqual(getRootAsJsonNodeValue(root).getLastChild(), children[1]);

    assertStrictNodesEqual(getRootAsJsonNodeValue(root), children[0].getParent(root));
    assertStrictNodesEqual(getRootAsJsonNodeValue(root), children[1].getParent(root));

    assert.strictEqual(findJsonNodeValue(root, "/a/a1").getKey(), "a1");
    assert.strictEqual(findJsonNodeValue(root, "/a/a1").getValue(), "foo");
    assert.strictEqual(findJsonNodeValue(root, "/a/a1").getRawValue(), "foo");

    assert.strictEqual(findJsonNodeValue(root, "/b/1").getKey(), "1");
    assert.strictEqual(findJsonNodeValue(root, "/b/1").getValue(), 2);
    assert.strictEqual(findJsonNodeValue(root, "/b/1").getRawValue(), 2);

    assert.strictEqual(findJsonNodeValue(root, "").getDepth(), 0);
    assert.strictEqual(findJsonNodeValue(root, "/a").getDepth(), 1);
    assert.strictEqual(findJsonNodeValue(root, "/b").getDepth(), 1);
    assert.strictEqual(findJsonNodeValue(root, "/a/a1").getDepth(), 2);
    assert.strictEqual(findJsonNodeValue(root, "/b/0").getDepth(), 2);

    assert.deepStrictEqual(findJsonNodeValue(root, "/a/a1").getKeyRange(root), [7, 11]);
    assert.deepStrictEqual(findJsonNodeValue(root, "/a/a1").getValueRange(root), [13, 18]);
    assert.deepStrictEqual(findJsonNodeValue(root, "/a/a1").getRange(root), [7, 18]);

    assert.strictEqual(findJsonNodeValue(root, "/b/2").getKeyRange(root), null);
    assert.deepStrictEqual(findJsonNodeValue(root, "/b/2").getValueRange(root), [49, 53]);
    assert.deepStrictEqual(findJsonNodeValue(root, "/b/2").getRange(root), [49, 53]);
  });

  test("YAML node", () => {
    const text = 'a:\n  a1: foo\n  "/a~": baz\nb:\n- x\n- 2\n- true';
    const root = safeParse(text, "yaml");
    assert.ok(root);

    assertStrictNodeEqual(getRootAsJsonNodeValue(root), root, "");
    assertStrictNodeEqual(findJsonNodeValue(root, ""), root, "");
    assertStrictNodeEqual(findJsonNodeValue(root, "/a/a1"), "foo", "/a/a1");
    assertStrictNodeEqual(findJsonNodeValue(root, "/a/~1a~0"), "baz", "/a/~1a~0");
    assertStrictNodeEqual(findJsonNodeValue(root, "/b/0"), "x", "/b/0");
    assertStrictNodeEqual(findJsonNodeValue(root, "/b/1"), 2, "/b/1");
    assertStrictNodeEqual(findJsonNodeValue(root, "/b/2"), true, "/b/2");

    assert.ok(findJsonNodeValue(root, "/a").isObject());
    assert.ok(findJsonNodeValue(root, "/b").isArray());
    assert.ok(findJsonNodeValue(root, "/a/a1").isScalar());

    const children = getRootAsJsonNodeValue(root).getChildren(true);
    assert.ok(children.length === 2);

    assertStrictNodesEqual(children[0].next(root).prev(root), children[0]);
    assertStrictNodesEqual(children[1].prev(root).next(root), children[1]);
    assertStrictNodesEqual(children[0].next(root), children[1]);
    assertStrictNodesEqual(children[0], children[1].prev(root));

    assertStrictNodesEqual(getRootAsJsonNodeValue(root).getFirstChild(), children[0]);
    assertStrictNodesEqual(getRootAsJsonNodeValue(root).getLastChild(), children[1]);

    assertStrictNodesEqual(getRootAsJsonNodeValue(root), children[0].getParent(root));
    assertStrictNodesEqual(getRootAsJsonNodeValue(root), children[1].getParent(root));

    assert.strictEqual(findJsonNodeValue(root, "/a/a1").getKey(), "a1");
    assert.strictEqual(findJsonNodeValue(root, "/a/a1").getValue(), "foo");
    assert.strictEqual(findJsonNodeValue(root, "/a/a1").getRawValue(), "foo");

    assert.strictEqual(findJsonNodeValue(root, "/b/1").getKey(), "1");
    assert.strictEqual(findJsonNodeValue(root, "/b/1").getValue(), 2);
    assert.strictEqual(findJsonNodeValue(root, "/b/1").getRawValue(), 2);

    assert.strictEqual(findJsonNodeValue(root, "").getDepth(), 0);
    assert.strictEqual(findJsonNodeValue(root, "/a").getDepth(), 1);
    assert.strictEqual(findJsonNodeValue(root, "/b").getDepth(), 1);
    assert.strictEqual(findJsonNodeValue(root, "/a/a1").getDepth(), 2);
    assert.strictEqual(findJsonNodeValue(root, "/b/0").getDepth(), 2);

    assert.deepStrictEqual(findJsonNodeValue(root, "/a/a1").getKeyRange(root), [5, 7]);
    assert.deepStrictEqual(findJsonNodeValue(root, "/a/a1").getValueRange(root), [9, 12]);
    assert.deepStrictEqual(findJsonNodeValue(root, "/a/a1").getRange(root), [5, 12]);

    assert.strictEqual(findJsonNodeValue(root, "/b/2").getKeyRange(root), null);
    assert.deepStrictEqual(findJsonNodeValue(root, "/b/2").getValueRange(root), [39, 43]);
    assert.deepStrictEqual(findJsonNodeValue(root, "/b/2").getRange(root), [39, 43]);
  });
});
