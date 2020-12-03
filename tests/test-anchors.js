/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import test from 'ava';
import { readFileSync } from 'fs';
import * as yaml from 'yaml-ast-parser-custom-tags';
import { YamlNode } from '../out/ast';

function parseYaml(text) {
  const yamlTree = yaml.load(text);
  return new YamlNode(yamlTree);
}

function loadYaml(filename) {
  return parseYaml(readFileSync(filename, { encoding: 'utf8' }));
}

test('finding nodes in the yaml with anchors', (t) => {
  const root = loadYaml('tests/anchors.yaml');
  // normal node
  t.is(root.find('/components/schemas/NewTestObj/properties/name/type').getValue(), 'string');
  // reference
  t.is(root.find('/components/schemas/NewTestObj2/properties/name/type').getValue(), 'string');
  // normal node
  t.is(root.find('/components/schemas/TestObj/properties/id/format').getValue(), 'uuid');
  // reference merge
  t.is(root.find('/components/schemas/TestObj/properties/name/type').getValue(), 'string');
});
