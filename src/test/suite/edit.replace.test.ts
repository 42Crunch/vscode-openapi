import assert from "assert";
import * as vscode from "vscode";
import { withRandomFileEditor } from "../utils";
import {
  getFixAsJsonString,
  getFixAsYamlString,
  replaceJsonNode,
  replaceYamlNode,
  safeParse,
} from "../../util";
import { FixContext, FixType, InsertReplaceRenameFix } from "../../types";
import { findJsonNodeValue } from "../../json-utils";

suite("Replace Node", () => {
  test("Method replaceJsonNode (object)", async () => {
    const text = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1\n ]\n}';
    const expected = '{\n "a": {\n  "a1": [\n   "qwe",\n   "baz"\n  ]\n },\n "c": [\n  1\n ]\n}';
    const pointer = "/a/a1";
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.Replace,
      fix: ["qwe", "baz"],
    };

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      let range: vscode.Range;
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

      let value = getFixAsJsonString(context);
      [value, range] = replaceJsonNode(context, value);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.strictEqual(doc.getText(), expected);
      });
    });
  });

  test("Method replaceJsonNode (array)", async () => {
    const text = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1\n ]\n}';
    const expected = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  {\n   "a2": "baz"\n  }\n ]\n}';
    const pointer = "/c/0";
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.Replace,
      fix: {
        a2: "baz",
      },
    };

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      let range: vscode.Range;
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

      let value = getFixAsJsonString(context);
      [value, range] = replaceJsonNode(context, value);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.strictEqual(doc.getText(), expected);
      });
    });
  });

  test("Method replaceYamlNode (object)", async () => {
    const text = "a:\n  a1: foo\nc:\n  - 1\n";
    const expected = "a:\n  a1: \n    - qwe\n    - baz\nc:\n  - 1\n";
    const pointer = "/a/a1";
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.Replace,
      fix: ["qwe", "baz"],
    };

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {
      let range: vscode.Range;
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

      let value = getFixAsYamlString(context);
      [value, range] = replaceYamlNode(context, value);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.strictEqual(doc.getText(), expected);
      });
    });
  });

  test("Method replaceYamlNode (array)", async () => {
    const text = "a:\n  a1: foo\nc:\n  - 1\n";
    const expected = "a:\n  a1: foo\nc:\n  - a2: baz\n";
    const pointer = "/c/0";
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.Replace,
      fix: {
        a2: "baz",
      },
    };

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {
      let range: vscode.Range;
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

      let value = getFixAsYamlString(context);
      [value, range] = replaceYamlNode(context, value);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.strictEqual(doc.getText(), expected);
      });
    });
  });
});
