import assert from "assert";
import * as vscode from "vscode";
import { readFileSync } from "fs";
import { withRandomFileEditor } from "../utils";
import { getFixAsJsonString, getFixAsYamlString, renameKeyNode, safeParse } from "../../util";
import { resolve } from "path";
import { FixContext, FixType, InsertReplaceRenameFix } from "../../types";
import { findJsonNodeValue } from "../../json-utils";

suite("Rename Key Node", () => {
  test("Method renameKeyNode (JSON)", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xhr.json"), { encoding: "utf8" });
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.RenameKey,
      fix: "999",
    };

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      const pointer = "/paths/~1posts/get/responses/200";
      const root = safeParse(editor.document.getText(), editor.document.languageId);
      const context: FixContext = {
        editor: editor,
        edit: null,
        issues: [],
        fix: <InsertReplaceRenameFix>fix,
        bulk: false,
        snippet: false,
        auditContext: null,
        version: null,
        bundle: null,
        root: root,
        target: findJsonNodeValue(root, pointer),
        document: editor.document,
      };

      const range = renameKeyNode(context);
      const edit = new vscode.WorkspaceEdit();
      const value = getFixAsJsonString(context);
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.strictEqual(doc.lineAt(23).text.trim(), '"999": {');
      });
    });
  });

  test("Method renameKeyNode (YAML)", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.yaml"), { encoding: "utf8" });
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.RenameKey,
      fix: "foo",
    };

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {
      const pointer = "/paths/~1%7BcomicId%7D~1info.0.json";
      const root = safeParse(editor.document.getText(), editor.document.languageId);
      const context: FixContext = {
        editor: editor,
        edit: null,
        issues: [],
        fix: <InsertReplaceRenameFix>fix,
        bulk: false,
        snippet: false,
        auditContext: null,
        version: null,
        bundle: null,
        root: root,
        target: findJsonNodeValue(root, pointer),
        document: editor.document,
      };

      const range = renameKeyNode(context);
      const edit = new vscode.WorkspaceEdit();
      const value = getFixAsYamlString(context);
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.strictEqual(doc.lineAt(39).text.trim(), "foo:");
      });
    });
  });
});
