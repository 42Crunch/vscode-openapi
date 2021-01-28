import assert from "assert";
import { updateTitle } from '../../audit/quickfix';

suite("Edit Update Title Test Suite", () => {

  test("Test 1", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Create 'b' property");
    updateTitle(titles, "Create 'c' property");
    assert.equal("Create 'a', 'b', 'c' property", titles.join(', '));
  });

  test("Test 2", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Create 'b' property");
    updateTitle(titles, "Create '403' response");
    updateTitle(titles, "Create '404' response");
    assert.equal("Create 'a', 'b' property, '403', '404' response", titles.join(', '));
  });

  test("Test 3", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Create 'b' property");
    updateTitle(titles, "Set 'required' property to true");
    updateTitle(titles, "Create '403' response");
    updateTitle(titles, "Create '404' response");
    assert.equal("Create 'a', 'b' property, set 'required' property to true, create '403', '404' response", titles.join(', '));
  });

  test("Test 4", () => {
    const titles = [];
    updateTitle(titles, "Create 'a' property");
    updateTitle(titles, "Bla bla bla bla");
    updateTitle(titles, "Set smth");
    updateTitle(titles, "Foo");
    assert.equal("Create 'a' property, bla bla bla bla, set smth, foo", titles.join(', '));
  });
});
