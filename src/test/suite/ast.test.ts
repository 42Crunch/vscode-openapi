import assert from 'assert';
import { loadJson, loadYaml, parseJson, parseYaml } from '../utils';
import { resolve } from 'path';

suite('Ast Test Suite', () => {
  test('finding nodes, top level, yaml', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    const swagger = root.find('/swagger');
    assert.equal(swagger.getValue(), '2.0');
    assert.equal(swagger.getKey(), 'swagger');

    const host = root.find('/host');
    assert.equal(host.getValue(), 'xkcd.com');
    assert.equal(host.getKey(), 'host');
  });

  test('finding nodes, top level, json', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    const swagger = root.find('/swagger');
    assert.equal(swagger.getValue(), '2.0');
    assert.equal(swagger.getKey(), 'swagger');

    const host = root.find('/host');
    assert.equal(host.getValue(), 'xkcd.com');
    assert.equal(host.getKey(), 'host');
  });

  test('json children', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    const paths = root.find('/paths');
    const children = paths.getChildren();
    assert.equal(children.length, 2);
    assert.equal(children[0].getKey(), '/info.0.json');
    assert.equal(children[1].getKey(), '/{comicId}/info.0.json');
  });

  test('yaml children', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    const paths = root.find('/paths');
    const children = paths.getChildren();
    assert.equal(children.length, 2);
    assert.equal(children[0].getKey(), '/info.0.json');
    assert.equal(children[1].getKey(), '/{comicId}/info.0.json');
  });

  test('json children array', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    const schemes = root.find('/schemes');
    const children = schemes.getChildren();
    assert.equal(children.length, 2);
    assert.equal(children[0].getKey(), '0');
    assert.equal(children[0].getValue(), 'http');
    assert.equal(children[1].getKey(), '1');
    assert.equal(children[1].getValue(), 'https');
  });

  test('yaml children array', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    const schemes = root.find('/schemes');
    const children = schemes.getChildren();
    assert.equal(children.length, 2);
    assert.equal(children[0].getKey(), '0');
    assert.equal(children[0].getValue(), 'http');
    assert.equal(children[1].getKey(), '1');
    assert.equal(children[1].getValue(), 'https');
  });

  test('finding nodes, multiple levels, json', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    const title = root.find('/info/title');
    assert.equal(title.getValue(), 'XKCD');

    const description = root.find('/paths/~1info.0.json/get/description');
    assert.equal(description.getValue(), 'Fetch current comic and metadata.\n');
  });

  test('finding nodes, multiple levels, yaml', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    const title = root.find('/info/title');
    assert.equal(title.getValue(), 'XKCD');

    const description = root.find('/paths/~1info.0.json/get/description');
    assert.equal(description.getValue(), 'Fetch current comic and metadata.\n');
  });

  test('json node depth', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    const info = root.find('/info');
    const title = root.find('/info/title');
    const description = root.find('/paths/~1info.0.json/get/description');
    const http = root.find('/schemes/0');

    assert.equal(root.getDepth(), 0);
    assert.equal(info.getDepth(), 1);
    assert.equal(title.getDepth(), 2);
    assert.equal(http.getDepth(), 2);
    assert.equal(description.getDepth(), 4);
  });

  test('yaml node depth', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    const info = root.find('/info');
    const title = root.find('/info/title');
    const description = root.find('/paths/~1info.0.json/get/description');
    const http = root.find('/schemes/0');

    assert.equal(root.getDepth(), 0);
    assert.equal(info.getDepth(), 1);
    assert.equal(title.getDepth(), 2);
    assert.equal(http.getDepth(), 2);
    assert.equal(description.getDepth(), 4);
  });

  test('json path and v3 petstore json', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/petstore-v3.json'));

    const schema = root.find('/paths/~1pets/get/parameters/0/schema');
    assert.ok(schema);

    const schema2 = root.find('/paths/~1pets/get/responses/200');
    assert.ok(schema2);
  });

  test('json path and v3 petstore yaml', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/petstore-v3.yaml'));

    const schema = root.find('/paths/~1pets/get/parameters/0/schema');
    assert.ok(schema);

    const schema2 = root.find('/paths/~1pets/get/responses/200');
    assert.ok(schema2);
  });

  test('slash escape in json', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/petstore-v3.json'));

    const schema = root.find('/paths/~1pets/get/responses/200/content/application~1json/schema');
    assert.ok(schema);
  });

  test('slash escape in yaml', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/petstore-v3.yaml'));

    const schema = root.find('/paths/~1pets/get/responses/200/content/application~1json/schema');
    assert.ok(schema);
  });

  test('yaml node getKey()', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    const responses = root.find('/paths/~1{comicId}~1info.0.json/get/parameters');
    const children = responses.getChildren();
    assert.equal(children.length, 1);
    assert.equal(children[0].getKey(), '0');
  });

  test('json node getKey()', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    const responses = root.find('/paths/~1{comicId}~1info.0.json/get/parameters');
    const children = responses.getChildren();
    assert.equal(children.length, 1);
    assert.equal(children[0].getKey(), '0');
  });

  test('json nodes getParent()', () => {
    const root = parseJson(`{"foo": [1,2], "bar": {"baz": true}}`);

    const foo = root.find('/foo');
    const foo0 = root.find('/foo/0');
    const foo1 = root.find('/foo/1');
    const baz = root.find('/bar/baz');
    assert.equal(foo.getKey(), 'foo');
    assert.equal(foo0.getKey(), '0');
    assert.equal(foo1.getKey(), '1');
    assert.equal(baz.getKey(), 'baz');

    assert.equal(foo0.getParent().getKey(), 'foo');
    assert.equal(foo1.getParent().getKey(), 'foo');
    assert.equal(baz.getParent().getKey(), 'bar');
  });

  test('yaml nodes getParent()', () => {
    const root = parseYaml(`
foo:
  - 1
  - 2
bar:
  baz: true`);

    const foo = root.find('/foo');
    const foo0 = root.find('/foo/0');
    const foo1 = root.find('/foo/1');
    const baz = root.find('/bar/baz');
    assert.equal(foo.getKey(), 'foo');
    assert.equal(foo0.getKey(), '0');
    assert.equal(foo1.getKey(), '1');
    assert.equal(baz.getKey(), 'baz');

    assert.equal(foo0.getParent().getKey(), 'foo');
    assert.equal(foo1.getParent().getKey(), 'foo');
    assert.equal(baz.getParent().getKey(), 'bar');
  });

  test('json top level list', () => {
    const root = parseJson(`[1,2]`);
    const top = root.find('');
    const one = root.find('/0');
    const two = root.find('/1');
    assert.ok(top);
    assert.equal(top.getChildren().length, 2);
    assert.equal(one.getValue(), 1);
    assert.equal(one.getValue(), 1);
    assert.equal(two.getValue(), 2);
  });

  test('yaml top level list', () => {
    const root = parseYaml(`
- 1
- 2`);

    const top = root.find('');
    const one = root.find('/0');
    const two = root.find('/1');
    assert.ok(top);
    assert.equal(one.getValue(), '1');
    assert.equal(two.getValue(), '2');
  });

  test('yaml findNodeAtOffset() top level array', () => {
    const text = '- a: b\n- c: d';
    const root = parseYaml(text);

    assert.equal(text.length, 13);
    assert.equal(root.findNodeAtOffset(12).getKey(), 'c');
    assert.equal(root.findNodeAtOffset(11).getKey(), 'c');
    assert.equal(root.findNodeAtOffset(10).getKey(), 'c');
    assert.equal(root.findNodeAtOffset(9).getKey(), 'c');
    assert.equal(root.findNodeAtOffset(8).getKey(), undefined);
    assert.equal(root.findNodeAtOffset(7).getKey(), undefined);
    assert.equal(root.findNodeAtOffset(6).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(5).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(4).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(3).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(2).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(1).getKey(), undefined);
    assert.equal(root.findNodeAtOffset(0).getKey(), undefined);
  });

  test('yaml findNodeAtOffset() top level object', () => {
    const text = 'a:\n - b: c';
    const root = parseYaml(text);

    assert.equal(text.length, 10);
    assert.equal(root.findNodeAtOffset(9).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(9).getValue(), 'c');
    assert.equal(root.findNodeAtOffset(8).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(7).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(6).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(5).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(4).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(3).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(2).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(1).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(0).getKey(), 'a');
  });

  test('yaml findNodeAtOffset() broken yaml', () => {
    const text = 'a:\n - b:';
    const root = parseYaml(text);

    assert.equal(text.length, 8);
    assert.equal(root.findNodeAtOffset(8).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(7).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(6).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(5).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(4).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(3).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(2).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(1).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(0).getKey(), 'a');
  });

  test('yaml findNodeAtOffset() broken yaml, more spaces', () => {
    const text = 'a:\n  b:   ';
    const root = parseYaml(text);

    assert.equal(text.length, 10);
    assert.equal(root.findNodeAtOffset(9).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(8).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(7).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(6).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(5).getKey(), 'b');
    assert.equal(root.findNodeAtOffset(4).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(3).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(2).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(1).getKey(), 'a');
    assert.equal(root.findNodeAtOffset(0).getKey(), 'a');
  });

  test('json getJsonPointer()', () => {
    const root = parseJson(`{"foo": [1,2], "bar": {"baz": true}, "ra/ro": true}`);
    assert.equal(root.find('').getJsonPonter(), '');
    assert.equal(root.find('/foo').getJsonPonter(), '/foo');
    assert.equal(root.find('/foo/0').getJsonPonter(), '/foo/0');
    assert.equal(root.find('/foo/1').getJsonPonter(), '/foo/1');
    assert.equal(root.find('/bar/baz').getJsonPonter(), '/bar/baz');
    assert.equal(root.find('/ra~1ro').getJsonPonter(), '/ra~1ro');
  });

  test('yaml getJsonPointer()', () => {
    const root = parseYaml(`
foo:
  - 1
  - 2
bar:
  baz: true
ra/ro: true`);

    assert.equal(root.find('').getJsonPonter(), '');
    assert.equal(root.find('/foo').getJsonPonter(), '/foo');
    assert.equal(root.find('/foo/0').getJsonPonter(), '/foo/0');
    assert.equal(root.find('/foo/1').getJsonPonter(), '/foo/1');
    assert.equal(root.find('/bar/baz').getJsonPonter(), '/bar/baz');
    assert.equal(root.find('/ra~1ro').getJsonPonter(), '/ra~1ro');
  });

  test('json prev()', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    const target = root.find('/swagger');
    assert.equal(target.prev(), undefined);
    assert.equal(target.next().getJsonPonter(), '/schemes');
    assert.equal(target.next().prev().getJsonPonter(), '/swagger');

    const target2 = root.find('/schemes/0');
    assert.equal(target2.prev(), undefined);
    assert.equal(target2.next().getJsonPonter(), '/schemes/1');
  });

  test('json next()', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    const target = root.find('/definitions');
    assert.equal(target.next(), undefined);
    assert.equal(target.prev().getJsonPonter(), '/paths');
    assert.equal(target.prev().next().getJsonPonter(), '/definitions');

    const target2 = root.find('/schemes/1');
    assert.equal(target2.next(), undefined);
    assert.equal(target2.prev().getJsonPonter(), '/schemes/0');
  });

  test('json isArray()', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    assert.equal(root.find('/schemes').isArray(), true);
    assert.equal(root.find('/schemes/0').isArray(), false);
    assert.equal(root.find('/host').isArray(), false);
    assert.equal(root.find('/info').isArray(), false);
  });

  test('json isObject()', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));

    assert.equal(root.find('/schemes').isObject(), false);
    assert.equal(root.find('/schemes/0').isObject(), false);
    assert.equal(root.find('/host').isObject(), false);
    assert.equal(root.find('/info').isObject(), true);
  });

  test('json getKeyRange()', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xhr.json'));

    assert.deepEqual(root.find('/info/license/name').getKeyRange(), [123, 127]);
    assert.deepEqual(root.find('/servers/1/url').getKeyRange(), [247, 250]);
    assert.deepEqual(root.find('/paths/~1posts/get/responses/200').getKeyRange(), [443, 446]);
    assert.equal(root.find('/servers/1').getKeyRange(), undefined);
  });

  test('json getValueRange()', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xhr.json'));

    assert.deepEqual(root.find('/info/license/name').getValueRange(), [130, 135]);
    assert.deepEqual(root.find('/servers/1/url').getValueRange(), [253, 291]);
    assert.deepEqual(root.find('/paths/~1posts/get/responses/200').getValueRange(), [449, 496]);
    assert.deepEqual(root.find('/servers/1').getValueRange(), [237, 298]);
  });

  test('yaml prev()', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    const target = root.find('/swagger');
    assert.equal(target.prev(), undefined);
    assert.equal(target.next().getJsonPonter(), '/schemes');
    assert.equal(target.next().prev().getJsonPonter(), '/swagger');

    const target2 = root.find('/schemes/0');
    assert.equal(target2.prev(), undefined);
    assert.equal(target2.next().getJsonPonter(), '/schemes/1');
  });

  test('yaml next()', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    const target = root.find('/definitions');
    assert.equal(target.next(), undefined);
    assert.equal(target.prev().getJsonPonter(), '/paths');
    assert.equal(target.prev().next().getJsonPonter(), '/definitions');

    const target2 = root.find('/schemes/1');
    assert.equal(target2.next(), undefined);
    assert.equal(target2.prev().getJsonPonter(), '/schemes/0');
  });

  test('yaml isArray()', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    assert.equal(root.find('/schemes').isArray(), true);
    assert.equal(root.find('/schemes/0').isArray(), false);
    assert.equal(root.find('/host').isArray(), false);
    assert.equal(root.find('/info').isArray(), false);
  });

  test('yaml isObject()', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    assert.equal(root.find('/schemes').isObject(), false);
    assert.equal(root.find('/schemes/0').isObject(), false);
    assert.equal(root.find('/host').isObject(), false);
    assert.equal(root.find('/info').isObject(), true);
  });

  test('yaml getKeyRange()', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    assert.deepEqual(root.find('/paths/~1%7BcomicId%7D~1info.0.json/get/responses/200').getKeyRange(), [1179, 1184]);
    assert.deepEqual(root.find('/info/x-tags').getKeyRange(), [569, 575]);
    assert.deepEqual(root.find('/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0/required').getKeyRange(), [
      1113,
      1121,
    ]);
    assert.equal(root.find('/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0').getKeyRange(), undefined);
  });

  test('yaml getValueRange()', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));

    assert.deepEqual(root.find('/paths/~1%7BcomicId%7D~1info.0.json/get/responses/200').getValueRange(), [1197, 1272]);
    assert.deepEqual(root.find('/info/x-tags').getValueRange(), [582, 607]);
    assert.deepEqual(root.find('/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0/required').getValueRange(), [
      1123,
      1127,
    ]);
    assert.deepEqual(root.find('/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0').getValueRange(), [1068, 1151]);
  });
});
