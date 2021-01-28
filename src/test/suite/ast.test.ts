import assert from "assert";
import { loadJson, loadYaml, parseJson, parseYaml, wrap } from "../utils";
import { resolve } from "path";
import { readFileSync } from 'fs';

suite("Ast Test Suite", () => {
  test("finding nodes, top level, yaml", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    const swagger = root.find("/swagger");
    assert.equal(swagger.getValue(), "2.0");
    assert.equal(swagger.getKey(), "swagger");

    const host = root.find("/host");
    assert.equal(host.getValue(), "xkcd.com");
    assert.equal(host.getKey(), "host");
  });

  test("finding nodes, top level, json", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    const swagger = root.find("/swagger");
    assert.equal(swagger.getValue(), "2.0");
    assert.equal(swagger.getKey(), "swagger");

    const host = root.find("/host");
    assert.equal(host.getValue(), "xkcd.com");
    assert.equal(host.getKey(), "host");
  });

  test("json children", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    const paths = root.find("/paths");
    const children = paths.getChildren();
    assert.equal(children.length, 2);
    assert.equal(children[0].getKey(), "/info.0.json");
    assert.equal(children[1].getKey(), "/{comicId}/info.0.json");
  });

  test("yaml children", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    const paths = root.find("/paths");
    const children = paths.getChildren();
    assert.equal(children.length, 2);
    assert.equal(children[0].getKey(), "/info.0.json");
    assert.equal(children[1].getKey(), "/{comicId}/info.0.json");
  });

  test("json children array", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    const schemes = root.find("/schemes");
    const children = schemes.getChildren();
    assert.equal(children.length, 2);
    assert.equal(children[0].getKey(), "0");
    assert.equal(children[0].getValue(), "http");
    assert.equal(children[1].getKey(), "1");
    assert.equal(children[1].getValue(), "https");
  });

  test("yaml children array", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    const schemes = root.find("/schemes");
    const children = schemes.getChildren();
    assert.equal(children.length, 2);
    assert.equal(children[0].getKey(), "0");
    assert.equal(children[0].getValue(), "http");
    assert.equal(children[1].getKey(), "1");
    assert.equal(children[1].getValue(), "https");
  });

  test("finding nodes, multiple levels, json", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    const title = root.find("/info/title");
    assert.equal(title.getValue(), "XKCD");

    const description = root.find("/paths/~1info.0.json/get/description");
    assert.equal(description.getValue(), "Fetch current comic and metadata.\n");
  });

  test("finding nodes, multiple levels, yaml", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    const title = root.find("/info/title");
    assert.equal(title.getValue(), "XKCD");

    const description = root.find("/paths/~1info.0.json/get/description");
    assert.equal(description.getValue(), "Fetch current comic and metadata.\n");
  });

  test("json node depth", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    const info = root.find("/info");
    const title = root.find("/info/title");
    const description = root.find("/paths/~1info.0.json/get/description");
    const http = root.find("/schemes/0");

    assert.equal(root.getDepth(), 0);
    assert.equal(info.getDepth(), 1);
    assert.equal(title.getDepth(), 2);
    assert.equal(http.getDepth(), 2);
    assert.equal(description.getDepth(), 4);
  });

  test("yaml node depth", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    const info = root.find("/info");
    const title = root.find("/info/title");
    const description = root.find("/paths/~1info.0.json/get/description");
    const http = root.find("/schemes/0");

    assert.equal(root.getDepth(), 0);
    assert.equal(info.getDepth(), 1);
    assert.equal(title.getDepth(), 2);
    assert.equal(http.getDepth(), 2);
    assert.equal(description.getDepth(), 4);
  });

  test("json path and v3 petstore json", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/petstore-v3.json"));

    const schema = root.find("/paths/~1pets/get/parameters/0/schema");
    assert.ok(schema);

    const schema2 = root.find("/paths/~1pets/get/responses/200");
    assert.ok(schema2);
  });

  test("json path and v3 petstore yaml", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/petstore-v3.yaml"));

    const schema = root.find("/paths/~1pets/get/parameters/0/schema");
    assert.ok(schema);

    const schema2 = root.find("/paths/~1pets/get/responses/200");
    assert.ok(schema2);
  });

  test("slash escape in json", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/petstore-v3.json"));

    const schema = root.find("/paths/~1pets/get/responses/200/content/application~1json/schema");
    assert.ok(schema);
  });

  test("slash escape in yaml", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/petstore-v3.yaml"));

    const schema = root.find("/paths/~1pets/get/responses/200/content/application~1json/schema");
    assert.ok(schema);
  });

  test("yaml node getKey()", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    const responses = root.find("/paths/~1{comicId}~1info.0.json/get/parameters");
    const children = responses.getChildren();
    assert.equal(children.length, 1);
    assert.equal(children[0].getKey(), "0");
  });

  test("json node getKey()", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    const responses = root.find("/paths/~1{comicId}~1info.0.json/get/parameters");
    const children = responses.getChildren();
    assert.equal(children.length, 1);
    assert.equal(children[0].getKey(), "0");
  });

  test("json nodes getParent()", () => {
    const root = parseJson(`{"foo": [1,2], "bar": {"baz": true}}`);

    const foo = root.find("/foo");
    const foo0 = root.find("/foo/0");
    const foo1 = root.find("/foo/1");
    const baz = root.find("/bar/baz");
    assert.equal(foo.getKey(), "foo");
    assert.equal(foo0.getKey(), "0");
    assert.equal(foo1.getKey(), "1");
    assert.equal(baz.getKey(), "baz");

    assert.equal(foo0.getParent().getKey(), "foo");
    assert.equal(foo1.getParent().getKey(), "foo");
    assert.equal(baz.getParent().getKey(), "bar");
  });

  test("yaml nodes getParent()", () => {
    const root = parseYaml(`
foo:
  - 1
  - 2
bar:
  baz: true`);

    const foo = root.find("/foo");
    const foo0 = root.find("/foo/0");
    const foo1 = root.find("/foo/1");
    const baz = root.find("/bar/baz");
    assert.equal(foo.getKey(), "foo");
    assert.equal(foo0.getKey(), "0");
    assert.equal(foo1.getKey(), "1");
    assert.equal(baz.getKey(), "baz");

    assert.equal(foo0.getParent().getKey(), "foo");
    assert.equal(foo1.getParent().getKey(), "foo");
    assert.equal(baz.getParent().getKey(), "bar");
  });

  test("json top level list", () => {
    const root = parseJson(`[1,2]`);
    const top = root.find("");
    const one = root.find("/0");
    const two = root.find("/1");
    assert.ok(top);
    assert.equal(top.getChildren().length, 2);
    assert.equal(one.getValue(), 1);
    assert.equal(one.getValue(), 1);
    assert.equal(two.getValue(), 2);
  });

  test("yaml top level list", () => {
    const root = parseYaml(`
- 1
- 2`);

    const top = root.find("");
    const one = root.find("/0");
    const two = root.find("/1");
    assert.ok(top);
    assert.equal(one.getValue(), "1");
    assert.equal(two.getValue(), "2");
  });

  test("yaml findNodeAtOffset() top level array", () => {
    const text = "- a: b\n- c: d";
    const root = parseYaml(text);

    assert.equal(text.length, 13);
    assert.equal(root.findNodeAtOffset(12).getKey(), "c");
    assert.equal(root.findNodeAtOffset(11).getKey(), "c");
    assert.equal(root.findNodeAtOffset(10).getKey(), "c");
    assert.equal(root.findNodeAtOffset(9).getKey(), "c");
    assert.equal(root.findNodeAtOffset(8).getKey(), undefined);
    assert.equal(root.findNodeAtOffset(7).getKey(), undefined);
    assert.equal(root.findNodeAtOffset(6).getKey(), "a");
    assert.equal(root.findNodeAtOffset(5).getKey(), "a");
    assert.equal(root.findNodeAtOffset(4).getKey(), "a");
    assert.equal(root.findNodeAtOffset(3).getKey(), "a");
    assert.equal(root.findNodeAtOffset(2).getKey(), "a");
    assert.equal(root.findNodeAtOffset(1).getKey(), undefined);
    assert.equal(root.findNodeAtOffset(0).getKey(), undefined);
  });

  test("yaml findNodeAtOffset() top level object", () => {
    const text = "a:\n - b: c";
    const root = parseYaml(text);

    assert.equal(text.length, 10);
    assert.equal(root.findNodeAtOffset(9).getKey(), "b");
    assert.equal(root.findNodeAtOffset(9).getValue(), "c");
    assert.equal(root.findNodeAtOffset(8).getKey(), "b");
    assert.equal(root.findNodeAtOffset(7).getKey(), "b");
    assert.equal(root.findNodeAtOffset(6).getKey(), "b");
    assert.equal(root.findNodeAtOffset(5).getKey(), "a");
    assert.equal(root.findNodeAtOffset(4).getKey(), "a");
    assert.equal(root.findNodeAtOffset(3).getKey(), "a");
    assert.equal(root.findNodeAtOffset(2).getKey(), "a");
    assert.equal(root.findNodeAtOffset(1).getKey(), "a");
    assert.equal(root.findNodeAtOffset(0).getKey(), "a");
  });

  test("yaml findNodeAtOffset() broken yaml", () => {
    const text = "a:\n - b:";
    const root = parseYaml(text);

    assert.equal(text.length, 8);
    assert.equal(root.findNodeAtOffset(8).getKey(), "b");
    assert.equal(root.findNodeAtOffset(7).getKey(), "b");
    assert.equal(root.findNodeAtOffset(6).getKey(), "b");
    assert.equal(root.findNodeAtOffset(5).getKey(), "a");
    assert.equal(root.findNodeAtOffset(4).getKey(), "a");
    assert.equal(root.findNodeAtOffset(3).getKey(), "a");
    assert.equal(root.findNodeAtOffset(2).getKey(), "a");
    assert.equal(root.findNodeAtOffset(1).getKey(), "a");
    assert.equal(root.findNodeAtOffset(0).getKey(), "a");
  });

  test("yaml findNodeAtOffset() broken yaml, more spaces", () => {
    const text = "a:\n  b:   ";
    const root = parseYaml(text);

    assert.equal(text.length, 10);
    assert.equal(root.findNodeAtOffset(9).getKey(), "b");
    assert.equal(root.findNodeAtOffset(8).getKey(), "b");
    assert.equal(root.findNodeAtOffset(7).getKey(), "b");
    assert.equal(root.findNodeAtOffset(6).getKey(), "b");
    assert.equal(root.findNodeAtOffset(5).getKey(), "b");
    assert.equal(root.findNodeAtOffset(4).getKey(), "a");
    assert.equal(root.findNodeAtOffset(3).getKey(), "a");
    assert.equal(root.findNodeAtOffset(2).getKey(), "a");
    assert.equal(root.findNodeAtOffset(1).getKey(), "a");
    assert.equal(root.findNodeAtOffset(0).getKey(), "a");
  });

  test("json getJsonPointer()", () => {
    const root = parseJson(`{"foo": [1,2], "bar": {"baz": true}, "ra/ro": true}`);
    assert.equal(root.find("").getJsonPonter(), "");
    assert.equal(root.find("/foo").getJsonPonter(), "/foo");
    assert.equal(root.find("/foo/0").getJsonPonter(), "/foo/0");
    assert.equal(root.find("/foo/1").getJsonPonter(), "/foo/1");
    assert.equal(root.find("/bar/baz").getJsonPonter(), "/bar/baz");
    assert.equal(root.find("/ra~1ro").getJsonPonter(), "/ra~1ro");
  });

  test("yaml getJsonPointer()", () => {
    const root = parseYaml(`
foo:
  - 1
  - 2
bar:
  baz: true
ra/ro: true`);

    assert.equal(root.find("").getJsonPonter(), "");
    assert.equal(root.find("/foo").getJsonPonter(), "/foo");
    assert.equal(root.find("/foo/0").getJsonPonter(), "/foo/0");
    assert.equal(root.find("/foo/1").getJsonPonter(), "/foo/1");
    assert.equal(root.find("/bar/baz").getJsonPonter(), "/bar/baz");
    assert.equal(root.find("/ra~1ro").getJsonPonter(), "/ra~1ro");
  });

  test("json prev()", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    const target = root.find("/swagger");
    assert.equal(target.prev(), undefined);
    assert.equal(target.next().getJsonPonter(), "/schemes");
    assert.equal(target.next().prev().getJsonPonter(), "/swagger");

    const target2 = root.find("/schemes/0");
    assert.equal(target2.prev(), undefined);
    assert.equal(target2.next().getJsonPonter(), "/schemes/1");
  });

  test("json next()", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    const target = root.find("/definitions");
    assert.equal(target.next(), undefined);
    assert.equal(target.prev().getJsonPonter(), "/paths");
    assert.equal(target.prev().next().getJsonPonter(), "/definitions");

    const target2 = root.find("/schemes/1");
    assert.equal(target2.next(), undefined);
    assert.equal(target2.prev().getJsonPonter(), "/schemes/0");
  });

  test("json isArray()", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    assert.equal(root.find("/schemes").isArray(), true);
    assert.equal(root.find("/schemes/0").isArray(), false);
    assert.equal(root.find("/host").isArray(), false);
    assert.equal(root.find("/info").isArray(), false);
  });

  test("json isObject()", () => {
    const root = loadJson(resolve(__dirname, "../../../tests/xkcd.json"));

    assert.equal(root.find("/schemes").isObject(), false);
    assert.equal(root.find("/schemes/0").isObject(), false);
    assert.equal(root.find("/host").isObject(), false);
    assert.equal(root.find("/info").isObject(), true);
  });

  test("json getKeyRange()", () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xhr.json"), { encoding: "utf8" });
    const root = parseJson(text);

    let range = root.find("/info/license/name").getKeyRange();
    assert.equal(text.substring(range[0], range[1]), 'name');

    range = root.find("/servers/1/url").getKeyRange();
    assert.equal(text.substring(range[0], range[1]), 'url');

	range = root.find("/paths/~1posts/get/responses/200").getKeyRange();
    assert.equal(text.substring(range[0], range[1]), '200');

    assert.equal(root.find("/servers/1").getKeyRange(), undefined);
  });

  test("json getValueRange()", () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xhr.json"), { encoding: "utf8" });
    const root = parseJson(text);
	
	let range = root.find("/info/license/name").getValueRange();
    assert.equal(text.substring(range[0], range[1]), '"MIT"');
	
	range = root.find("/servers/1/url").getValueRange();
    assert.equal(text.substring(range[0], range[1]), 
      '"https://jsonplaceholder.typicode.com"');
	
	range = root.find("/paths/~1posts/get/responses/200").getValueRange();
    assert.equal(wrap(text.substring(range[0], range[1])), 
      '{\n            "description": "OK"\n          }');
	
	range = root.find("/servers/1").getValueRange();
    assert.equal(wrap(text.substring(range[0], range[1])), 
      '{\n      "url": "https://jsonplaceholder.typicode.com"\n    }');
  });

  test("yaml prev()", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    const target = root.find("/swagger");
    assert.equal(target.prev(), undefined);
    assert.equal(target.next().getJsonPonter(), "/schemes");
    assert.equal(target.next().prev().getJsonPonter(), "/swagger");

    const target2 = root.find("/schemes/0");
    assert.equal(target2.prev(), undefined);
    assert.equal(target2.next().getJsonPonter(), "/schemes/1");
  });

  test("yaml next()", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    const target = root.find("/definitions");
    assert.equal(target.next(), undefined);
    assert.equal(target.prev().getJsonPonter(), "/paths");
    assert.equal(target.prev().next().getJsonPonter(), "/definitions");

    const target2 = root.find("/schemes/1");
    assert.equal(target2.next(), undefined);
    assert.equal(target2.prev().getJsonPonter(), "/schemes/0");
  });

  test("yaml isArray()", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    assert.equal(root.find("/schemes").isArray(), true);
    assert.equal(root.find("/schemes/0").isArray(), false);
    assert.equal(root.find("/host").isArray(), false);
    assert.equal(root.find("/info").isArray(), false);
  });

  test("yaml isObject()", () => {
    const root = loadYaml(resolve(__dirname, "../../../tests/xkcd.yaml"));

    assert.equal(root.find("/schemes").isObject(), false);
    assert.equal(root.find("/schemes/0").isObject(), false);
    assert.equal(root.find("/host").isObject(), false);
    assert.equal(root.find("/info").isObject(), true);
  });

  test("yaml getKeyRange()", () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.yaml"), { encoding: "utf8" });
    const root = parseYaml(text);

    let range = root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/responses/200").getKeyRange();
    assert.equal(text.substring(range[0], range[1]), "'200'");
   
    range = root.find("/info/x-tags").getKeyRange();
    assert.equal(text.substring(range[0], range[1]), 'x-tags');
   
    range = root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0/required").getKeyRange();
    assert.equal(text.substring(range[0], range[1]), 'required');

    assert.equal(
      root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0").getKeyRange(),
      undefined
    );
  });

  test("yaml getValueRange()", () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.yaml"), { encoding: "utf8" });
    const root = parseYaml(text);

    let range = root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/responses/200").getValueRange();
    assert.equal(wrap(text.substring(range[0], range[1])), 
      "description: OK\n          schema:\n            $ref: '#/definitions/comic'");
	
    range = root.find("/info/x-tags").getValueRange();
      assert.equal(wrap(text.substring(range[0], range[1])), 
        '- humor\n    - comics\n  ');
    
    range = root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0/required").getValueRange();
      assert.equal(wrap(text.substring(range[0], range[1])), 'true');
    
    range = root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0").getValueRange();
      assert.equal(wrap(text.substring(range[0], range[1])), 
        'in: path\n          name: comicId\n          required: true\n          type: number');
  });
});
