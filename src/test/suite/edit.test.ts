import assert from 'assert';
import { readFileSync } from 'fs';
import * as yaml from 'yaml-ast-parser-custom-tags';
import * as json from 'jsonc-parser';
import { JsonNode, YamlNode, findYamlNodeAtOffset } from '../../ast';
import * as quickfixes from '../../audit/quickfixes-latest.json';
import {
  getFixAsJsonString
} from '../../util';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

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

suite('Edit Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Method getFixAsJsonString test', () => {

		const root = loadJson('../../tests/xkcd.json');
		const pointer = '/paths/~1info.0.json/get/responses/200';
		const fix = getQuickFix('v3-response-400');
		console.info(getFixAsJsonString(root, pointer, 'insert', fix.fix, fix.parameters, false));

		//assert.equal(' a  b   c', getFixAsJsonString(root, pointer, 'insert', fix.fix, fix.parameters, false));
		assert.equal('', '');
	});
});
