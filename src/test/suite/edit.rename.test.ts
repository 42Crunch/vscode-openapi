import assert from 'assert';
import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { withRandomFileEditor } from '../utils';
import { renameKeyNode, safeParse } from '../../util';
import { resolve } from 'path';

suite('Edit Rename Key Node Test Suite', () => {
  test('Methos renameKeyNode (json) test', async () => {
    const text = readFileSync(resolve(__dirname, '../../../tests/xhr.json'), { encoding: 'utf8' });
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
    const text = readFileSync(resolve(__dirname, '../../../tests/xkcd.yaml'), { encoding: 'utf8' });
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
});
