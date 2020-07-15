/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import test from 'ava';
import { readFileSync } from 'fs';
import * as yaml from 'yaml-ast-parser-custom-tags';
import * as json from 'jsonc-parser';
import { JsonNode, YamlNode, findYamlNodeAtOffset } from '../out/ast';

function parseJson(text) {
  const jsonTree = json.parseTree(text);
  return new JsonNode(jsonTree);
}

function loadJson(filename) {
  return parseJson(readFileSync(filename, { encoding: 'utf8' }));
}

function parseYaml(text) {
  const yamlTree = yaml.load(text);
  return new YamlNode(yamlTree);
}

function loadYaml(filename) {
  return parseYaml(readFileSync(filename, { encoding: 'utf8' }));
}

test('finding nodes, top level, yaml', (t) => {
  const root = loadYaml('tests/xkcd.yaml');

  const swagger = root.find('/swagger');
  t.is(swagger.getValue(), '2.0');
  t.is(swagger.getKey(), 'swagger');

  const host = root.find('/host');
  t.is(host.getValue(), 'xkcd.com');
  t.is(host.getKey(), 'host');
});

test('finding nodes, top level, json', (t) => {
  const root = loadJson('tests/xkcd.json');

  const swagger = root.find('/swagger');
  t.is(swagger.getValue(), '2.0');
  t.is(swagger.getKey(), 'swagger');

  const host = root.find('/host');
  t.is(host.getValue(), 'xkcd.com');
  t.is(host.getKey(), 'host');
});

test('json children', (t) => {
  const root = loadJson('tests/xkcd.json');

  const paths = root.find('/paths');
  const children = paths.getChildren();
  t.is(children.length, 2);
  t.is(children[0].getKey(), '/info.0.json');
  t.is(children[1].getKey(), '/{comicId}/info.0.json');
});

test('yaml children', (t) => {
  const root = loadYaml('tests/xkcd.yaml');

  const paths = root.find('/paths');
  const children = paths.getChildren();
  t.is(children.length, 2);
  t.is(children[0].getKey(), '/info.0.json');
  t.is(children[1].getKey(), '/{comicId}/info.0.json');
});

test('json children array', (t) => {
  const root = loadJson('tests/xkcd.json');

  const schemes = root.find('/schemes');
  const children = schemes.getChildren();
  t.is(children.length, 2);
  t.is(children[0].getKey(), '0');
  t.is(children[0].getValue(), 'http');
  t.is(children[1].getKey(), '1');
  t.is(children[1].getValue(), 'https');
});

test('yaml children array', (t) => {
  const root = loadYaml('tests/xkcd.yaml');

  const schemes = root.find('/schemes');
  const children = schemes.getChildren();
  t.is(children.length, 2);
  t.is(children[0].getKey(), '0');
  t.is(children[0].getValue(), 'http');
  t.is(children[1].getKey(), '1');
  t.is(children[1].getValue(), 'https');
});

test('finding nodes, multiple levels, json', (t) => {
  const root = loadJson('tests/xkcd.json');

  const title = root.find('/info/title');
  t.is(title.getValue(), 'XKCD');

  const description = root.find('/paths/~1info.0.json/get/description');
  t.is(description.getValue(), 'Fetch current comic and metadata.\n');
});

test('finding nodes, multiple levels, yaml', (t) => {
  const root = loadYaml('tests/xkcd.yaml');

  const title = root.find('/info/title');
  t.is(title.getValue(), 'XKCD');

  const description = root.find('/paths/~1info.0.json/get/description');
  t.is(description.getValue(), 'Fetch current comic and metadata.\n');
});

test('json node depth', (t) => {
  const root = loadJson('tests/xkcd.json');

  const info = root.find('/info');
  const title = root.find('/info/title');
  const description = root.find('/paths/~1info.0.json/get/description');
  const http = root.find('/schemes/0');

  t.is(root.getDepth(), 0);
  t.is(info.getDepth(), 1);
  t.is(title.getDepth(), 2);
  t.is(http.getDepth(), 2);
  t.is(description.getDepth(), 4);
});

test('yaml node depth', (t) => {
  const root = loadYaml('tests/xkcd.yaml');

  const info = root.find('/info');
  const title = root.find('/info/title');
  const description = root.find('/paths/~1info.0.json/get/description');
  const http = root.find('/schemes/0');

  t.is(root.getDepth(), 0);
  t.is(info.getDepth(), 1);
  t.is(title.getDepth(), 2);
  t.is(http.getDepth(), 2);
  t.is(description.getDepth(), 4);
});

test('json path and v3 petstore json', (t) => {
  const root = loadJson('tests/petstore-v3.json');

  const schema = root.find('/paths/~1pets/get/parameters/0/schema');
  t.truthy(schema);

  const schema2 = root.find('/paths/~1pets/get/responses/200');
  t.truthy(schema2);
});

test('json path and v3 petstore yaml', (t) => {
  const root = loadYaml('tests/petstore-v3.yaml');

  const schema = root.find('/paths/~1pets/get/parameters/0/schema');
  t.truthy(schema);

  const schema2 = root.find('/paths/~1pets/get/responses/200');
  t.truthy(schema2);
});

test('slash escape in json', (t) => {
  const root = loadJson('tests/petstore-v3.json');

  const schema = root.find('/paths/~1pets/get/responses/200/content/application~1json/schema');
  t.truthy(schema);
});

test('slash escape in yaml', (t) => {
  const root = loadYaml('tests/petstore-v3.yaml');

  const schema = root.find('/paths/~1pets/get/responses/200/content/application~1json/schema');
  t.truthy(schema);
});

test('yaml node getKey()', (t) => {
  const root = loadYaml('tests/xkcd.yaml');

  const responses = root.find('/paths/~1{comicId}~1info.0.json/get/parameters');
  const children = responses.getChildren();
  t.is(children.length, 1);
  t.is(children[0].getKey(), '0');
});

test('json node getKey()', (t) => {
  const root = loadJson('tests/xkcd.json');

  const responses = root.find('/paths/~1{comicId}~1info.0.json/get/parameters');
  const children = responses.getChildren();
  t.is(children.length, 1);
  t.is(children[0].getKey(), '0');
});

test('json nodes getParent()', (t) => {
  const root = parseJson(`{"foo": [1,2], "bar": {"baz": true}}`);

  const foo = root.find('/foo');
  const foo0 = root.find('/foo/0');
  const foo1 = root.find('/foo/1');
  const baz = root.find('/bar/baz');
  t.is(foo.getKey(), 'foo');
  t.is(foo0.getKey(), '0');
  t.is(foo1.getKey(), '1');
  t.is(baz.getKey(), 'baz');

  t.is(foo0.getParent().getKey(), 'foo');
  t.is(foo1.getParent().getKey(), 'foo');
  t.is(baz.getParent().getKey(), 'bar');
});

test('yaml nodes getParent()', (t) => {
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
  t.is(foo.getKey(), 'foo');
  t.is(foo0.getKey(), '0');
  t.is(foo1.getKey(), '1');
  t.is(baz.getKey(), 'baz');

  t.is(foo0.getParent().getKey(), 'foo');
  t.is(foo1.getParent().getKey(), 'foo');
  t.is(baz.getParent().getKey(), 'bar');
});

test('json top level list', (t) => {
  const root = parseJson(`[1,2]`);
  const top = root.find('');
  const one = root.find('/0');
  const two = root.find('/1');
  t.truthy(top);
  t.is(top.getChildren().length, 2);
  t.is(one.getValue(), 1);
  t.is(one.getValue(), 1);
  t.is(two.getValue(), 2);
});

test('yaml top level list', (t) => {
  const root = parseYaml(`
- 1
- 2`);

  const top = root.find('');
  const one = root.find('/0');
  const two = root.find('/1');
  t.truthy(top);
  t.is(one.getValue(), '1');
  t.is(two.getValue(), '2');
});

test('yaml findNodeAtOffset() top level array', (t) => {
  const text = '- a: b\n- c: d';
  const root = parseYaml(text);

  t.is(text.length, 13);
  t.is(root.findNodeAtOffset(12).getKey(), 'c');
  t.is(root.findNodeAtOffset(11).getKey(), 'c');
  t.is(root.findNodeAtOffset(10).getKey(), 'c');
  t.is(root.findNodeAtOffset(9).getKey(), 'c');
  t.is(root.findNodeAtOffset(8).getKey(), undefined);
  t.is(root.findNodeAtOffset(7).getKey(), undefined);
  t.is(root.findNodeAtOffset(6).getKey(), 'a');
  t.is(root.findNodeAtOffset(5).getKey(), 'a');
  t.is(root.findNodeAtOffset(4).getKey(), 'a');
  t.is(root.findNodeAtOffset(3).getKey(), 'a');
  t.is(root.findNodeAtOffset(2).getKey(), 'a');
  t.is(root.findNodeAtOffset(1).getKey(), undefined);
  t.is(root.findNodeAtOffset(0).getKey(), undefined);
});

test('yaml findNodeAtOffset() top level object', (t) => {
  const text = 'a:\n - b: c';
  const root = parseYaml(text);

  t.is(text.length, 10);
  t.is(root.findNodeAtOffset(9).getKey(), 'b');
  t.is(root.findNodeAtOffset(9).getValue(), 'c');
  t.is(root.findNodeAtOffset(8).getKey(), 'b');
  t.is(root.findNodeAtOffset(7).getKey(), 'b');
  t.is(root.findNodeAtOffset(6).getKey(), 'b');
  t.is(root.findNodeAtOffset(5).getKey(), 'a');
  t.is(root.findNodeAtOffset(4).getKey(), 'a');
  t.is(root.findNodeAtOffset(3).getKey(), 'a');
  t.is(root.findNodeAtOffset(2).getKey(), 'a');
  t.is(root.findNodeAtOffset(1).getKey(), 'a');
  t.is(root.findNodeAtOffset(0).getKey(), 'a');
});

test('yaml findNodeAtOffset() broken yaml', (t) => {
  const text = 'a:\n - b:';
  const root = parseYaml(text);

  t.is(text.length, 8);
  t.is(root.findNodeAtOffset(8).getKey(), 'b');
  t.is(root.findNodeAtOffset(7).getKey(), 'b');
  t.is(root.findNodeAtOffset(6).getKey(), 'b');
  t.is(root.findNodeAtOffset(5).getKey(), 'a');
  t.is(root.findNodeAtOffset(4).getKey(), 'a');
  t.is(root.findNodeAtOffset(3).getKey(), 'a');
  t.is(root.findNodeAtOffset(2).getKey(), 'a');
  t.is(root.findNodeAtOffset(1).getKey(), 'a');
  t.is(root.findNodeAtOffset(0).getKey(), 'a');
});

test('yaml findNodeAtOffset() broken yaml, more spaces', (t) => {
  const text = 'a:\n  b:   ';
  const root = parseYaml(text);

  t.is(text.length, 10);
  t.is(root.findNodeAtOffset(9).getKey(), 'b');
  t.is(root.findNodeAtOffset(8).getKey(), 'b');
  t.is(root.findNodeAtOffset(7).getKey(), 'b');
  t.is(root.findNodeAtOffset(6).getKey(), 'b');
  t.is(root.findNodeAtOffset(5).getKey(), 'b');
  t.is(root.findNodeAtOffset(4).getKey(), 'a');
  t.is(root.findNodeAtOffset(3).getKey(), 'a');
  t.is(root.findNodeAtOffset(2).getKey(), 'a');
  t.is(root.findNodeAtOffset(1).getKey(), 'a');
  t.is(root.findNodeAtOffset(0).getKey(), 'a');
});

test('json getJsonPointer()', (t) => {
  const root = parseJson(`{"foo": [1,2], "bar": {"baz": true}, "ra/ro": true}`);
  t.is(root.find('').getJsonPonter(), '');
  t.is(root.find('/foo').getJsonPonter(), '/foo');
  t.is(root.find('/foo/0').getJsonPonter(), '/foo/0');
  t.is(root.find('/foo/1').getJsonPonter(), '/foo/1');
  t.is(root.find('/bar/baz').getJsonPonter(), '/bar/baz');
  t.is(root.find('/ra~1ro').getJsonPonter(), '/ra~1ro');
});

test('yaml getJsonPointer()', (t) => {
  const root = parseYaml(`
foo:
  - 1
  - 2
bar:
  baz: true
ra/ro: true`);

  t.is(root.find('').getJsonPonter(), '');
  t.is(root.find('/foo').getJsonPonter(), '/foo');
  t.is(root.find('/foo/0').getJsonPonter(), '/foo/0');
  t.is(root.find('/foo/1').getJsonPonter(), '/foo/1');
  t.is(root.find('/bar/baz').getJsonPonter(), '/bar/baz');
  t.is(root.find('/ra~1ro').getJsonPonter(), '/ra~1ro');
});
