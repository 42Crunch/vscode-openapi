import assert from "assert";
import { updateTitle } from "../../audit/quickfix";

suite("Update Title", () => {
  test("Title 1", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Create 'b' property");
    updateTitle(titles, "Create 'c' property");
    assert.strictEqual("Create 'a', 'b', 'c' properties", titles.join(", "));
  });

  test("Title 2", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Create 'b' property");
    updateTitle(titles, "Create '403' response");
    updateTitle(titles, "Create '404' response");
    assert.strictEqual("Create 'a', 'b' properties, '403', '404' responses", titles.join(", "));
  });

  test("Title 3", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Create 'b' property");
    updateTitle(titles, "Set 'required' property to true");
    updateTitle(titles, "Create '403' response");
    updateTitle(titles, "Create '404' response");
    assert.strictEqual(
      "Create 'a', 'b' properties, set 'required' property to true, create '403', '404' responses",
      titles.join(", ")
    );
  });

  test("Title 4", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Bla bla bla bla");
    updateTitle(titles, "Set smth");
    updateTitle(titles, "Foo");
    assert.strictEqual("Create 'a' property, bla bla bla bla, set smth, foo", titles.join(", "));
  });

  test("Title 5", () => {
    const titles = [];
    updateTitle(titles, "Create 'a', 'b' properties");
    updateTitle(titles, "Create 'c' property");
    assert.strictEqual("Create 'a', 'b', 'c' properties", titles.join(", "));
  });

  test("Title 6", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Create 'b', 'c' properties");
    assert.strictEqual("Create 'a', 'b', 'c' properties", titles.join(", "));
  });

  test("Title 7", () => {
    const titles = [];
    updateTitle(titles, "Create 'a', 'b' properties");
    updateTitle(titles, "Create 'c', 'd' properties");
    assert.strictEqual("Create 'a', 'b', 'c', 'd' properties", titles.join(", "));
  });
});
