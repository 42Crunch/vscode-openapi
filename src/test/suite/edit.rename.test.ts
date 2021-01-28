import assert from "assert";
import * as vscode from "vscode";
import { readFileSync } from "fs";
import { withRandomFileEditor } from "../utils";
import { renameKeyNode, safeParse } from "../../util";
import { resolve } from "path";
import { FixContext } from '../../types';

suite("Edit Rename Key Node Test Suite", () => {

  test("Methos renameKeyNode (json) test", async () => {

    const text = readFileSync(resolve(__dirname, "../../../tests/xhr.json"), { encoding: "utf8" });

    await withRandomFileEditor(text, "json", async (editor, doc) => {

      const pointer = "/paths/~1posts/get/responses/200";
      const root = safeParse(editor.document.getText(), editor.document.languageId);
      const context: FixContext = {
        editor: editor,
        edit: null,
        issues: [],
        fix: null,
        bulk: false,
        snippet: false,
        auditContext: null,
        cacheEntry: null,
        pointer: pointer,
        root: root,
        target: root.find(pointer),
        document: editor.document
      };
      
      const range = renameKeyNode(context);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, "999");

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.lineAt(23).text.trim(), '"999": {');
      });
    });
  });

  test("Methos renameKeyNode (yaml) test", async () => {

    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.yaml"), { encoding: "utf8" });

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {

      const pointer = "/paths/~1%7BcomicId%7D~1info.0.json";
      const root = safeParse(editor.document.getText(), editor.document.languageId);
      const context: FixContext = {
        editor: editor,
        edit: null,
        issues: [],
        fix: null,
        bulk: false,
        snippet: false,
        auditContext: null,
        cacheEntry: null,
        pointer: pointer,
        root: root,
        target: root.find(pointer),
        document: editor.document
      };

      const range = renameKeyNode(context);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, "foo");

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.lineAt(39).text.trim(), "foo:");
      });
    });
  });
});
