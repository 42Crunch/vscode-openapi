import assert from 'assert';
import * as vscode from 'vscode';
import { withRandomFileEditor } from '../utils';
import { getFixAsJsonString, getFixAsYamlString, insertJsonNode, insertYamlNode, safeParse } from '../../util';

suite('Edit Insert Node Test Suite', () => {

	test('Methos insertJsonNode (key - value) test', async () => {

		const text = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1\n ],\n}';
		const expected = '{\n "a": {\n  "a1": "foo",\n  "a2": "baz"\n },\n "c": [\n  1\n ],\n}';
		const pointer = '/a';
		const fix = {
			"a2": "baz"
		};

		await withRandomFileEditor(text, async (editor, doc) => {

			let position: vscode.Position;
			const root = safeParse(editor.document.getText(), editor.document.languageId);
			let value = getFixAsJsonString(root, pointer, 'insert', fix, undefined, true);
			[value, position] = insertJsonNode(editor.document, root, pointer, value);

			return editor.insertSnippet(new vscode.SnippetString(value), position).then(() => {
				assert.ok(doc.isDirty);
				assert.equal(doc.getText(), expected);
			});
		});
	});

	test('Methos insertJsonNode (array member) test', async () => {

		const text = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1\n ],\n}';
		const expected = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1,\n  {\n      "a2": "baz"\n  }\n ],\n}';
		const pointer = '/c';
		const fix = {
			"a2": "baz"
		};

		await withRandomFileEditor(text, async (editor, doc) => {

			let position: vscode.Position;
			const root = safeParse(editor.document.getText(), editor.document.languageId);
			let value = getFixAsJsonString(root, pointer, 'insert', fix, undefined, true);
			[value, position] = insertJsonNode(editor.document, root, pointer, value);

			return editor.insertSnippet(new vscode.SnippetString(value), position).then(() => {
				assert.ok(doc.isDirty);
				assert.equal(doc.getText(), expected);
			});
		});
	});

	test('Methos insertYamlNode (key - value) test', async () => {

		const text = 'a:\n  a1: foo\nc:\n  - 1\n';
		const expected = 'a:\n  a1: foo\n  a2: baz\nc:\n  - 1\n';
		const pointer = '/a';
		const fix = {
			"a2": "baz"
		};

		await withRandomFileEditor(text, async (editor, doc) => {

			let position: vscode.Position;
			const root = safeParse(editor.document.getText(), 'yaml');
			let value = getFixAsYamlString(root, pointer, 'insert', fix, undefined, true);
			[value, position] = insertYamlNode(editor.document, root, pointer, value);

			return editor.insertSnippet(new vscode.SnippetString(value), position).then(() => {
				assert.ok(doc.isDirty);
				assert.equal(doc.getText(), expected);
				
			});
		});
	});
	
	test('Methos insertYamlNode (array member) test', async () => {

		const text = 'a:\n  a1: foo\nc:\n  - 1\n';
		const expected = 'a:\n  a1: foo\nc:\n  - 1\n  - a2: baz\n';
		const pointer = '/c';
		const fix = {
			"a2": "baz"
		};

		await withRandomFileEditor(text, async (editor, doc) => {

			let position: vscode.Position;
			const root = safeParse(editor.document.getText(), 'yaml');
			let value = getFixAsYamlString(root, pointer, 'insert', fix, undefined, true);
			[value, position] = insertYamlNode(editor.document, root, pointer, value);

			return editor.insertSnippet(new vscode.SnippetString(value), position).then(() => {
				assert.ok(doc.isDirty);
				assert.equal(doc.getText(), expected);
			});
		});
	});
});
