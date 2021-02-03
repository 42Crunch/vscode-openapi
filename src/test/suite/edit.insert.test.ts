import assert from "assert";
import * as vscode from "vscode";
import { withRandomFileEditor } from "../utils";
import {
  getFixAsJsonString,
  getFixAsYamlString,
  insertJsonNode,
  insertYamlNode,
  safeParse,
} from "../../util";
import { FixContext, FixType, InsertReplaceRenameFix } from '../../types';

suite("Edit Insert Node Test Suite", () => {

  test("Methos insertJsonNode (key - value) test", async () => {

    const text = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1\n ],\n}';
    const expected = '{\n "a": {\n  "a1": "foo",\n  "a2": "baz"\n },\n "c": [\n  1\n ],\n}';
    const pointer = "/a";
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.Insert,
      fix: {
        a2: "baz"
      }
    };

    await withRandomFileEditor(text, "json", async (editor, doc) => {

      let position: vscode.Position;
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
        pointer: pointer,
        root: root,
        target: root.find(pointer),
        document: editor.document
      };
      
      let value = getFixAsJsonString(context);
      [value, position] = insertJsonNode(context, value);

      const edit = new vscode.WorkspaceEdit();
      edit.insert(editor.document.uri, position, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.getText(), expected);
      });
    });
  });

  test("Methos insertJsonNode (array member) test", async () => {

    const text = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1\n ],\n}';
    const expected =
      '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1,\n  {\n   "a2": "baz"\n  }\n ],\n}';
    const pointer = "/c";
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.Insert,
      fix: {
        a2: "baz"
      }
    };

    await withRandomFileEditor(text, "json", async (editor, doc) => {

      let position: vscode.Position;
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
        pointer: pointer,
        root: root,
        target: root.find(pointer),
        document: editor.document
      };

      let value = getFixAsJsonString(context);
      [value, position] = insertJsonNode(context, value);

      const edit = new vscode.WorkspaceEdit();
      edit.insert(editor.document.uri, position, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.getText(), expected);
      });
    });
  });

  test("Methos insertYamlNode (key - value) test", async () => {

    const text = "a:\n  a1: foo\nc:\n  - 1\n";
    const expected = "a:\n  a1: foo\n  a2: baz\nc:\n  - 1\n";
    const pointer = "/a";
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.Insert,
      fix: {
        a2: "baz"
      }
    };

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {

      let position: vscode.Position;
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
        pointer: pointer,
        root: root,
        target: root.find(pointer),
        document: editor.document
      };

      let value = getFixAsYamlString(context);
      [value, position] = insertYamlNode(context, value);

      const edit = new vscode.WorkspaceEdit();
      edit.insert(editor.document.uri, position, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.getText(), expected);
      });
    });
  });

  test("Methos insertYamlNode (array member) test", async () => {

    const text = "a:\n  a1: foo\nc:\n  - 1\n";
    const expected = "a:\n  a1: foo\nc:\n  - 1\n  - a2: baz\n";
    const pointer = "/c";
    const fix = {
      problem: ["xxx"],
      title: "xxx",
      type: FixType.Insert,
      fix: {
        a2: "baz"
      }
    };

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {

      let position: vscode.Position;
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
        pointer: pointer,
        root: root,
        target: root.find(pointer),
        document: editor.document
      };

      let value = getFixAsYamlString(context);
      [value, position] = insertYamlNode(context, value);

      const edit = new vscode.WorkspaceEdit();
      edit.insert(editor.document.uri, position, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.getText(), expected);
      });
    });
  });
});
