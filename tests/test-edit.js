import test from 'ava';
import * as quickfixes from '../out/audit/quickfixes-latest.json';
import {
  getFixAsJsonString
} from '../out/util';

var vscode = {};

function parseJson(text) {
  const jsonTree = json.parseTree(text);
  return new JsonNode(jsonTree);
}

function loadJson(filename) {
  return parseJson(readFileSync(filename, { encoding: 'utf8' }));
}

function getQuickFix(problemId) {
  for (const fix of quickfixes.fixes) {
    if (fix.problem.indexOf(problemId) >= 0) {
      return fix;
    }
  }
  return null;
}

test('getFixAsJsonString', (t) => {

  //getFixAsJsonString(root: Node, pointer: string, type: string, fix: object, parameters: FixParameters[], snippet: boolean);
  const root = loadJson('tests/xkcd.json');
  const pointer = '/paths/~1info.0.json/get/responses/200';
  const fix = getQuickFix('v3-response-400');
  console.info(getFixAsJsonString(root, pointer, 'insert', fix.fix, fix.parameters, false));
  t.is(' a  b   c', getFixAsJsonString(root, pointer, 'insert', fix.fix, fix.parameters, false));
});
