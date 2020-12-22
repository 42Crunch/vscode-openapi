import assert from 'assert';
import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { loadJson, loadYaml, withRandomFileEditor } from '../utils';
import { deleteJsonNode, deleteYamlNode, getFixAsJsonString, getFixAsYamlString, renameKeyNode, safeParse } from '../../util';

suite('Edit Test Suite', () => {

	test('Method getFixAsJsonString test', () => {

		const root = loadJson('../../tests/xkcd.json');
		const pointer = '/paths/~1info.0.json/get/responses/200';
		const fix = {
			"problem": [
				"v3-response-400"
			],
			"title": "Add 404 response",
			"type": "insert",
			"fix": {
				"400": {
					"$ref": "#/abc"
				}
			}
		};

		assert.equal('"400": {\n\t"$ref": "#/abc"\n}', getFixAsJsonString(root, pointer, 'insert', fix.fix, undefined, false));
		assert.equal('"400": {\n\t"\\$ref": "#/abc"\n}', getFixAsJsonString(root, pointer, 'insert', fix.fix, undefined, true));

		const parameters = [
			{
				"name": "code",
				"path": "/400/$ref",
				"values": [
					"a",
					"b",
					"c,d, e"
				]
			}
		];
		assert.equal('"400": {\n\t"$ref": "${1|a,b,c\\,d\\, e|}"\n}', getFixAsJsonString(root, pointer, 'insert', fix.fix, parameters, false));

		const parameters2 = [
			{
				"name": "code",
				"type": "key",
				"path": "/400"
			}
		];
		assert.equal('"${1:400}": {\n\t"$ref": "#/abc"\n}', getFixAsJsonString(root, pointer, 'insert', fix.fix, parameters2, false));
	});

	test('Method getFixAsYamlString test', () => {

		const root = loadYaml('../../tests/xkcd.yaml');
		const pointer = '/paths/~1info.0.json/get/responses/200';
		const fix = {
			"problem": [
				"v3-response-400"
			],
			"title": "Add 404 response",
			"type": "insert",
			"fix": {
				"400": {
					"$ref": "#/abc"
				}
			}
		};

		assert.equal('\'400\':\n\t$ref: \'#/abc\'', getFixAsYamlString(root, pointer, 'insert', fix.fix, undefined, false));
		assert.equal('\'400\':\n\t\\$ref: \'#/abc\'', getFixAsYamlString(root, pointer, 'insert', fix.fix, undefined, true));

		const parameters = [
			{
				"name": "code",
				"path": "/400/$ref",
				"values": [
					"a",
					"b",
					"c,d, e"
				]
			}
		];
		assert.equal('\'400\':\n\t$ref: \'${1|a,b,c\\,d\\, e|}\'', getFixAsYamlString(root, pointer, 'insert', fix.fix, parameters, false));

		const parameters2 = [
			{
				"name": "code",
				"type": "key",
				"path": "/400"
			}
		];
		assert.equal('\'${1:400}\':\n\t$ref: \'#/abc\'', getFixAsYamlString(root, pointer, 'insert', fix.fix, parameters2, false));
	});

	test('Methos renameKeyNode (json) test', async () => {

		const text = readFileSync('../../tests/xhr.json', { encoding: 'utf8' });
		await withRandomFileEditor(text, async (editor, doc) => {

			const root = safeParse(editor.document.getText(), editor.document.languageId);
			const range = renameKeyNode(editor.document, root, '/paths/~1posts/get/responses/200');
			const edit = new vscode.WorkspaceEdit();
			edit.replace(editor.document.uri, range, '999');

			return vscode.workspace.applyEdit(edit).then(() => {
				assert.ok(doc.isDirty);
				assert.equal(doc.lineAt(23).text.trim(), '"999": {');
			});
		});
	});

	test('Methos renameKeyNode (yaml) test', async () => {

		const text = readFileSync('../../tests/xkcd.yaml', { encoding: 'utf8' });
		await withRandomFileEditor(text, async (editor, doc) => {

			const root = safeParse(editor.document.getText(), 'yaml');
			const range = renameKeyNode(editor.document, root, '/paths/~1%7BcomicId%7D~1info.0.json');
			const edit = new vscode.WorkspaceEdit();
			edit.replace(editor.document.uri, range, 'foo');

			return vscode.workspace.applyEdit(edit).then(() => {
				assert.ok(doc.isDirty);
				assert.equal(doc.lineAt(39).text.trim(), 'foo:');
			});
		});
	});

	test('Methos deleteJsonNode test', async () => {

		const text = readFileSync('../../tests/xhr.json', { encoding: 'utf8' });
		const expected = '{\r\n  "openapi": "3.0.0",\r\n  "servers": [\r\n    {\r\n      "url": "http://jsonplaceholder.typicode.com"\r\n    }\r\n  ]\r\n}\r\n';

		await withRandomFileEditor(text, async (editor, doc) => {

			const root = safeParse(editor.document.getText(), editor.document.languageId);
			const edit = new vscode.WorkspaceEdit();
			edit.delete(editor.document.uri, deleteJsonNode(editor.document, root, '/info'));
			edit.delete(editor.document.uri, deleteJsonNode(editor.document, root, '/servers/1'));
			edit.delete(editor.document.uri, deleteJsonNode(editor.document, root, '/paths'));

			return vscode.workspace.applyEdit(edit).then(() => {
				assert.ok(doc.isDirty);
				assert.equal(doc.getText(), expected);
			});
		});
	});

	test('Methos deleteYamlNode test', async () => {

		const text = readFileSync('../../tests/xkcd.yaml', { encoding: 'utf8' });
		const expected = 'swagger: \'2.0\'\r\nschemes:\r\n  - https\r\nhost: xkcd.com\r\n\r\n';

		await withRandomFileEditor(text, async (editor, doc) => {

			const root = safeParse(editor.document.getText(), 'yaml');
			const edit = new vscode.WorkspaceEdit();
			edit.delete(editor.document.uri, deleteYamlNode(editor.document, root, '/basePath'));
			edit.delete(editor.document.uri, deleteYamlNode(editor.document, root, '/info'));
			edit.delete(editor.document.uri, deleteYamlNode(editor.document, root, '/externalDocs'));
			edit.delete(editor.document.uri, deleteYamlNode(editor.document, root, '/securityDefinitions'));
			edit.delete(editor.document.uri, deleteYamlNode(editor.document, root, '/paths'));
			edit.delete(editor.document.uri, deleteYamlNode(editor.document, root, '/definitions'));
			edit.delete(editor.document.uri, deleteYamlNode(editor.document, root, '/schemes/0'));

			return vscode.workspace.applyEdit(edit).then(() => {
				assert.ok(doc.isDirty);
				assert.equal(doc.getText(), expected);
			});
		});
	});
});
