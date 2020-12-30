import assert from 'assert';
import { loadYaml } from '../utils';
import { resolve } from 'path';

suite('Anchors Test Suite', () => {
  test('finding nodes in the yaml with anchors', () => {
    const root = loadYaml(resolve(__dirname, '../../../tests/anchors.yaml'));
    // normal node
    assert.equal(root.find('/components/schemas/NewTestObj/properties/name/type').getValue(), 'string');
    // reference
    assert.equal(root.find('/components/schemas/NewTestObj2/properties/name/type').getValue(), 'string');
    // normal node
    assert.equal(root.find('/components/schemas/TestObj/properties/id/format').getValue(), 'uuid');
    // reference merge
    assert.equal(root.find('/components/schemas/TestObj/properties/name/type').getValue(), 'string');
  });
});
