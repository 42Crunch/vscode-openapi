import assert from 'assert';
import { loadJson, loadYaml } from '../utils';
import { getFixAsJsonString, getFixAsYamlString } from '../../util';
import { resolve } from 'path';

suite('Edit Get Fix As String Test Suite', () => {
  test('Method getFixAsJsonString test', () => {
    const root = loadJson(resolve(__dirname, '../../../tests/xkcd.json'));
    const pointer = '/paths/~1info.0.json/get/responses/200';
    const fix = {
      problem: ['v3-response-400'],
      title: 'Add 404 response',
      type: 'insert',
      fix: {
        '400': {
          $ref: '#/abc',
        },
      },
    };

    assert.equal(
      '"400": {\n\t"$ref": "#/abc"\n}',
      getFixAsJsonString(root, pointer, 'insert', fix.fix, undefined, false),
    );
    assert.equal(
      '"400": {\n\t"\\$ref": "#/abc"\n}',
      getFixAsJsonString(root, pointer, 'insert', fix.fix, undefined, true),
    );

    const parameters = [
      {
        name: 'code',
        path: '/400/$ref',
        values: ['a', 'b', 'c,d, e'],
      },
    ];
    assert.equal(
      '"400": {\n\t"$ref": "${1|a,b,c\\,d\\, e|}"\n}',
      getFixAsJsonString(root, pointer, 'insert', fix.fix, parameters, false),
    );

    const parameters2 = [
      {
        name: 'code',
        type: 'key',
        path: '/400',
      },
    ];
    assert.equal(
      '"${1:400}": {\n\t"$ref": "#/abc"\n}',
      getFixAsJsonString(root, pointer, 'insert', fix.fix, parameters2, false),
    );
  });

  test('Method getFixAsYamlString test', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/xkcd.yaml'));
    const pointer = '/paths/~1info.0.json/get/responses/200';
    const fix = {
      problem: ['v3-response-400'],
      title: 'Add 404 response',
      type: 'insert',
      fix: {
        '400': {
          $ref: '#/abc',
        },
      },
    };

    assert.equal("'400':\n\t$ref: '#/abc'", getFixAsYamlString(root, pointer, 'insert', fix.fix, undefined, false));
    assert.equal("'400':\n\t\\$ref: '#/abc'", getFixAsYamlString(root, pointer, 'insert', fix.fix, undefined, true));

    const parameters = [
      {
        name: 'code',
        path: '/400/$ref',
        values: ['a', 'b', 'c,d, e'],
      },
    ];
    assert.equal(
      "'400':\n\t$ref: '${1|a,b,c\\,d\\, e|}'",
      getFixAsYamlString(root, pointer, 'insert', fix.fix, parameters, false),
    );

    const parameters2 = [
      {
        name: 'code',
        type: 'key',
        path: '/400',
      },
    ];
    assert.equal(
      "'${1:400}':\n\t$ref: '#/abc'",
      getFixAsYamlString(root, pointer, 'insert', fix.fix, parameters2, false),
    );
  });
});
