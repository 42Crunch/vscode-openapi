import assert from "assert";
import * as vscode from "vscode";
import { readFileSync } from "fs";
import { getContextUpdatedByPointer, withRandomFileEditor, wrap } from "../utils";
import { deleteJsonNode, deleteYamlNode, safeParse } from "../../util";
import { resolve } from "path";
import { FixContext } from "../../types";

suite("Delete Node", () => {
  test("Method deleteJsonNode", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xhr.json"), { encoding: "utf8" });
    const expected =
      '{\n  "openapi": "3.0.0",\n  "servers": [\n    {\n      "url": "http://jsonplaceholder.typicode.com"\n    }\n  ]\n}\n';

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      const context: FixContext = {
        editor: editor,
        edit: null,
        issues: [],
        fix: null,
        bulk: false,
        snippet: false,
        auditContext: null,
        version: null,
        bundle: null,
        root: safeParse(editor.document.getText(), editor.document.languageId),
        target: null,
        document: editor.document,
      };
      const edit = new vscode.WorkspaceEdit();

      edit.delete(
        editor.document.uri,
        deleteJsonNode(getContextUpdatedByPointer(context, "/info"))
      );
      edit.delete(
        editor.document.uri,
        deleteJsonNode(getContextUpdatedByPointer(context, "/servers/1"))
      );
      edit.delete(
        editor.document.uri,
        deleteJsonNode(getContextUpdatedByPointer(context, "/paths"))
      );

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.strictEqual(wrap(doc.getText()), expected);
      });
    });
  });

  test("Method deleteYamlNode", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.yaml"), { encoding: "utf8" });
    const expected = "swagger: '2.0'\nschemes:\n  - https\nhost: xkcd.com\n\n";

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {
      const context: FixContext = {
        editor: editor,
        edit: null,
        issues: [],
        fix: null,
        bulk: false,
        snippet: false,
        auditContext: null,
        version: null,
        bundle: null,
        root: safeParse(editor.document.getText(), editor.document.languageId),
        target: null,
        document: editor.document,
      };
      const edit = new vscode.WorkspaceEdit();

      edit.delete(
        editor.document.uri,
        deleteYamlNode(getContextUpdatedByPointer(context, "/basePath"))
      );
      edit.delete(
        editor.document.uri,
        deleteYamlNode(getContextUpdatedByPointer(context, "/info"))
      );
      edit.delete(
        editor.document.uri,
        deleteYamlNode(getContextUpdatedByPointer(context, "/externalDocs"))
      );
      edit.delete(
        editor.document.uri,
        deleteYamlNode(getContextUpdatedByPointer(context, "/securityDefinitions"))
      );

      edit.delete(
        editor.document.uri,
        deleteYamlNode(getContextUpdatedByPointer(context, "/paths"))
      );
      edit.delete(
        editor.document.uri,
        deleteYamlNode(getContextUpdatedByPointer(context, "/definitions"))
      );
      edit.delete(
        editor.document.uri,
        deleteYamlNode(getContextUpdatedByPointer(context, "/schemes/0"))
      );

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.strictEqual(wrap(doc.getText()), expected);
      });
    });
  });
});
