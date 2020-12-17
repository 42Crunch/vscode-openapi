/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import test from 'ava';
import { readFileSync } from 'fs';
import * as yaml from 'yaml-ast-parser-custom-tags';
import * as json from 'jsonc-parser';
import { replace } from '../out/ast/replace';

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

test('yaml replace value', (t) => {
  const yaml = `foo: bar`;
  const replaced = replace(yaml, 'yaml', [{ pointer: '/foo', value: 'baz' }]);
  t.is(replaced, `foo: baz`);
});

test('yaml replace key', (t) => {
  const yaml = `foo: bar`;
  const replaced = replace(yaml, 'yaml', [{ pointer: '/foo', value: 'baz', replaceKey: true }]);
  t.is(replaced, `baz: bar`);
});

test('yaml replace value in array', (t) => {
  const yaml = `
foo: one
bar:
  - one
  - two
baz: three`;

  const replaced = replace(yaml, 'yaml', [{ pointer: '/bar/1', value: 'baz' }]);

  const expected = `
foo: one
bar:
  - one
  - baz
baz: three`;

  t.is(expected, replaced);
});

test('json replace value', (t) => {
  const yaml = '{"foo": "bar"}';
  const replaced = replace(yaml, 'json', [{ pointer: '/foo', value: '"baz"' }]);
  t.is('{"foo": "baz"}', replaced);
});

test('json replace value in array', (t) => {
  const yaml = '{"foo": ["bar", "baz"]}';
  const replaced = replace(yaml, 'json', [{ pointer: '/foo/0', value: '"boom"' }]);
  t.is('{"foo": ["boom", "baz"]}', replaced);
});

test('jsob replace key', (t) => {
  const yaml = '{"foo": "bar"}';
  const replaced = replace(yaml, 'json', [{ pointer: '/foo', value: 'baz', replaceKey: true }]);
  t.is('{"baz": "bar"}', replaced);
});
