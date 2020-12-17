/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import test from 'ava';
import { replace } from '../out/ast/replace';

test('yaml replace value', (t) => {
  t.is(`foo: baz`, replace('foo: bar', 'yaml', [{ pointer: '/foo', value: 'baz' }]));
});

test('yaml replace quoted value', (t) => {
  t.is(`foo: "baz"`, replace(`foo: "bar"`, 'yaml', [{ pointer: '/foo', value: 'baz' }]));
  t.is(`foo: 'baz'`, replace(`foo: 'bar'`, 'yaml', [{ pointer: '/foo', value: 'baz' }]));
});

test('yaml replace unquoted value', (t) => {
  t.is(`foo: true`, replace(`foo: false`, 'yaml', [{ pointer: '/foo', value: 'true' }]));
  t.is(`foo: 123`, replace(`foo: 321`, 'yaml', [{ pointer: '/foo', value: '123' }]));
});

test('yaml replace value, multiple replacements', (t) => {
  t.is(
    `boom: baz`,
    replace('foo: bar', 'yaml', [
      { pointer: '/foo', value: 'baz' },
      { pointer: '/foo', value: 'boom', replaceKey: true },
    ]),
  );
});

test('yaml replace value, flow', (t) => {
  t.is(`foo: {"bar": "boom"}`, replace(`foo: {"bar": "baz"}`, 'yaml', [{ pointer: '/foo/bar', value: 'boom' }]));
});

test('yaml replace value, flow, array', (t) => {
  const yaml = `foo: ["bar", "baz"]`;
  t.is(`foo: ["boom", "baz"]`, replace(yaml, 'yaml', [{ pointer: '/foo/0', value: 'boom' }]));
  t.is(`foo: ["bar", "boom"]`, replace(yaml, 'yaml', [{ pointer: '/foo/1', value: 'boom' }]));
});

test('yaml replace key', (t) => {
  t.is(`baz: bar`, replace('foo: bar', 'yaml', [{ pointer: '/foo', value: 'baz', replaceKey: true }]));
});

test('yaml replace quoted key', (t) => {
  t.is(`"300": bar`, replace('"200": bar', 'yaml', [{ pointer: '/200', value: '300', replaceKey: true }]));
});

test('yaml replace key, flow', (t) => {
  const yaml = `foo: {"bar": "baz"}`;
  t.is(`foo: {"boom": "baz"}`, replace(yaml, 'yaml', [{ pointer: '/foo/bar', value: 'boom', replaceKey: true }]));
});

test('yaml replace value in array', (t) => {
  const yaml = `
foo: one
bar:
  - one
  - two
baz: three`;

  t.is(
    `
foo: one
bar:
  - one
  - baz
baz: three`,
    replace(yaml, 'yaml', [{ pointer: '/bar/1', value: 'baz' }]),
  );

  t.is(
    `
foo: one
bar:
  - baz
  - two
baz: three`,
    replace(yaml, 'yaml', [{ pointer: '/bar/0', value: 'baz' }]),
  );
});

test('json replace value', (t) => {
  t.is('{"foo": "baz"}', replace('{"foo": "bar"}', 'json', [{ pointer: '/foo', value: 'baz' }]));
});

test('json replace unqoted value', (t) => {
  t.is('{"foo": true}', replace('{"foo": false}', 'json', [{ pointer: '/foo', value: 'true' }]));
  t.is('{"foo": 123}', replace('{"foo": 321}', 'json', [{ pointer: '/foo', value: '123' }]));
});

test('json replace value, multiple replacements', (t) => {
  t.is(
    '{"boom": "baz"}',
    replace('{"foo": "bar"}', 'json', [
      { pointer: '/foo', value: 'baz' },
      { pointer: '/foo', value: 'boom', replaceKey: true },
    ]),
  );
});

test('json replace value in array', (t) => {
  t.is('{"foo": ["boom", "baz"]}', replace('{"foo": ["bar", "baz"]}', 'json', [{ pointer: '/foo/0', value: 'boom' }]));

  t.is('{"foo": ["bar", "boom"]}', replace('{"foo": ["bar", "baz"]}', 'json', [{ pointer: '/foo/1', value: 'boom' }]));
});

test('json replace key', (t) => {
  t.is('{"baz": "bar"}', replace('{"foo": "bar"}', 'json', [{ pointer: '/foo', value: 'baz', replaceKey: true }]));
  t.is(
    '{"foo": {"baz": "baz"}}',
    replace('{"foo": {"bar": "baz"}}', 'json', [{ pointer: '/foo/bar', value: 'baz', replaceKey: true }]),
  );
});
