import assert from "assert";
import { getPointerChild, getPointerLastSegment, getPointerParent } from "../../pointer";

suite("Pointer", () => {
  test("Method getPointerLastSegment", () => {
    assert.strictEqual(getPointerLastSegment("/a"), "a");
    assert.strictEqual(getPointerLastSegment("/a/b"), "b");
    assert.strictEqual(getPointerLastSegment("/a/0"), "0");
    assert.strictEqual(getPointerLastSegment("/a/b/c"), "c");
    assert.strictEqual(getPointerLastSegment("/a~1b~0c"), "a/b~c");
  });

  test("Method getPointerParent", () => {
    assert.strictEqual(getPointerParent("/a"), "");
    assert.strictEqual(getPointerParent("/a/b"), "/a");
    assert.strictEqual(getPointerParent("/a/0"), "/a");
    assert.strictEqual(getPointerParent("/a/b/c"), "/a/b");
    assert.strictEqual(getPointerParent("/a~1b~0c/foo"), "/a~1b~0c");
  });

  test("Method getPointerChild", () => {
    assert.strictEqual(getPointerChild("", "a"), "/a");
    assert.strictEqual(getPointerChild("/a", "b"), "/a/b");
    assert.strictEqual(getPointerChild("/a", "0"), "/a/0");
    assert.strictEqual(getPointerChild("/a/b", "c"), "/a/b/c");
    assert.strictEqual(getPointerChild("/a~1b~0c", "foo"), "/a~1b~0c/foo");
    assert.strictEqual(getPointerChild("/baz", "a/b~c"), "/baz/a~1b~0c");
  });
});
