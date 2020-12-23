import assert from 'assert';
import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { withRandomFileEditor } from '../utils';
import { deleteJsonNode, deleteYamlNode, safeParse } from '../../util';

suite('Edit Delete Node Test Suite', () => {

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
