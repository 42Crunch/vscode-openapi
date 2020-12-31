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

suite("Edit Replace Node Test Suite", () => {
  test("Methos replaceJsonNode (key - value) test", async () => {
    const text = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1\n ],\n}';
    const expected = '{\n "a": {\n  "a1": [\n    "qwe",\n    "baz"\n  ]\n },\n "c": [\n  1\n ],\n}';
    const pointer = "/a/a1";
    const fix = ["qwe", "baz"];

    await withRandomFileEditor(text, async (editor, doc) => {
      let range: vscode.Range;
      const root = safeParse(editor.document.getText(), editor.document.languageId);
      let value = getFixAsJsonString(root, pointer, "replace", fix, undefined, false);
      [value, range] = replaceJsonNode(editor.document, root, pointer, value);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.getText(), expected);
      });
    });
  });

  test("Methos replaceJsonNode (array member) test", async () => {
    const text = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  1\n ],\n}';
    const expected = '{\n "a": {\n  "a1": "foo"\n },\n "c": [\n  {\n    "a2": "baz"\n  }\n ],\n}';
    const pointer = "/c/0";
    const fix = {
      a2: "baz",
    };

    await withRandomFileEditor(text, async (editor, doc) => {
      let range: vscode.Range;
      const root = safeParse(editor.document.getText(), editor.document.languageId);
      let value = getFixAsJsonString(root, pointer, "replace", fix, undefined, false);
      [value, range] = replaceJsonNode(editor.document, root, pointer, value);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.getText(), expected);
      });
    });
  });

  test("Methos replaceYamlNode (key - value) test", async () => {
    const text = "a:\n  a1: foo\nc:\n  - 1\n";
    const expected = "a:\n  a1: \n    - qwe\n    - baz\nc:\n  - 1\n";
    const pointer = "/a/a1";
    const fix = ["qwe", "baz"];

    await withRandomFileEditor(text, async (editor, doc) => {
      let range: vscode.Range;
      const root = safeParse(editor.document.getText(), "yaml");
      let value = getFixAsYamlString(root, pointer, "replace", fix, undefined, false);
      [value, range] = replaceYamlNode(editor.document, root, pointer, value);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.getText(), expected);
      });
    });
  });

  test("Methos replaceYamlNode (array member) test", async () => {
    const text = "a:\n  a1: foo\nc:\n  - 1\n";
    const expected = "a:\n  a1: foo\nc:\n  - a2: baz\n";
    const pointer = "/c/0";
    const fix = {
      a2: "baz",
    };

    await withRandomFileEditor(text, async (editor, doc) => {
      let range: vscode.Range;
      const root = safeParse(editor.document.getText(), "yaml");
      let value = getFixAsYamlString(root, pointer, "replace", fix, undefined, false);
      [value, range] = replaceYamlNode(editor.document, root, pointer, value);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, value);

      return vscode.workspace.applyEdit(edit).then(() => {
        assert.ok(doc.isDirty);
        assert.equal(doc.getText(), expected);
      });
    });
  });
});
