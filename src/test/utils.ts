// @ts-nocheck FixContext is improperly initialized, but it should be ok for the test

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { TestFS } from "./memfs";
import * as assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";
import { workspace, window, TextEditor, TextDocument } from "vscode";
import { FixContext, FixType, OpenApiVersion } from "../types";
import { Parsed, parseJson, parseYaml } from "@xliic/preserving-json-yaml-parser";
import { findJsonNodeValue, getRootAsJsonNodeValue, JsonNodeValue } from "../json-utils";
import {
  getFixAsJsonString,
  getFixAsYamlString,
  renameKeyNode,
  replaceJsonNode,
  safeParse,
} from "../util";
import { componentsTags, topTags } from "../audit/quickfix";
import { safeParse } from "../util";
import { getAllComponentPointers, getPointersByComponents, cmpSets } from "../commands";
import { getDeadRefs, fixDelete, fixDeleteApplyIfNeeded } from "../audit/quickfix";

export async function replaceKey(editor: vscode.TextEditor, pointer: string, key: string) {
  const root = safeParse(editor.document.getText(), editor.document.languageId);
  const context: FixContext = {
    editor: editor,
    edit: null,
    issues: [],
    fix: {
      problem: ["x"],
      title: "x",
      type: FixType.RenameKey,
      fix: key,
    },
    bulk: false,
    snippet: false,
    auditContext: null,
    version: null,
    bundle: null,
    root: root,
    target: findJsonNodeValue(root, pointer),
    document: editor.document,
  };

  const edit = new vscode.WorkspaceEdit();
  if (editor.document.languageId === "json" || editor.document.languageId === "jsonc") {
    edit.replace(editor.document.uri, renameKeyNode(context), getFixAsJsonString(context));
  } else {
    edit.replace(editor.document.uri, renameKeyNode(context), getFixAsYamlString(context));
  }
  await vscode.workspace.applyEdit(edit);
}

export async function replaceValue(editor: vscode.TextEditor, pointer: string, value: string) {
  const root = safeParse(editor.document.getText(), editor.document.languageId);
  const context: FixContext = {
    editor: editor,
    edit: null,
    issues: [],
    fix: {
      problem: ["x"],
      title: "x",
      type: FixType.Replace,
      fix: value,
    },
    bulk: false,
    snippet: false,
    auditContext: null,
    version: null,
    bundle: null,
    root: root,
    target: findJsonNodeValue(root, pointer),
    document: editor.document,
  };

  const edit = new vscode.WorkspaceEdit();
  const [fixAsString, range] = replaceJsonNode(context, getFixAsJsonString(context));
  edit.replace(editor.document.uri, range, fixAsString);
  await vscode.workspace.applyEdit(edit);
}

export function rndName() {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 10);
}

export const testFs = new TestFS("fake-fs", true);
vscode.workspace.registerFileSystemProvider(testFs.scheme, testFs, {
  isCaseSensitive: testFs.isCaseSensitive,
});

export async function createRandomFile(
  contents = "",
  dir: vscode.Uri | undefined = undefined,
  ext = ""
): Promise<vscode.Uri> {
  let fakeFile: vscode.Uri;
  if (dir) {
    assert.equal(dir.scheme, testFs.scheme);
    fakeFile = dir.with({ path: dir.path + "/" + rndName() + ext });
  } else {
    fakeFile = vscode.Uri.parse(`${testFs.scheme}:/${rndName() + ext}`);
  }
  testFs.writeFile(fakeFile, Buffer.from(contents), { create: true, overwrite: true });
  return fakeFile;
}

export async function deleteFile(file: vscode.Uri): Promise<boolean> {
  try {
    testFs.delete(file);
    return true;
  } catch {
    return false;
  }
}

export function pathEquals(path1: string, path2: string): boolean {
  if (process.platform !== "linux") {
    path1 = path1.toLowerCase();
    path2 = path2.toLowerCase();
  }

  return path1 === path2;
}

export function closeAllEditors(): Promise<any> {
  return vscode.commands.executeCommand("workbench.action.closeAllEditors");
}

export async function revertAllDirty(): Promise<void> {
  return vscode.commands.executeCommand("_workbench.revertAllDirty");
}

export function disposeAll(disposables: vscode.Disposable[]) {
  vscode.Disposable.from(...disposables).dispose();
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function withLogDisabled(runnable: () => Promise<any>): () => Promise<void> {
  return async (): Promise<void> => {
    const logLevel = await vscode.commands.executeCommand("_extensionTests.getLogLevel");
    await vscode.commands.executeCommand("_extensionTests.setLogLevel", 6 /* critical */);

    try {
      await runnable();
    } finally {
      await vscode.commands.executeCommand("_extensionTests.setLogLevel", logLevel);
    }
  };
}

export function loadJson(filename) {
  return parseJson(readFileSync(filename, { encoding: "utf8" }));
}

export function loadYaml(filename) {
  return parseYaml(readFileSync(filename, { encoding: "utf8" }));
}

export function withRandomFileEditor(
  initialContents: string,
  languageId: string,
  run: (editor: TextEditor, doc: TextDocument) => Promise<void>
): Promise<boolean> {
  return workspace
    .openTextDocument({ language: languageId, content: initialContents })
    .then((doc) => {
      return window.showTextDocument(doc).then((editor) => {
        return run(editor, doc).then((_) => {
          return true;
        });
      });
    });
}

export function getContextUpdatedByPointer(context: FixContext, pointer: string): FixContext {
  context.target = findJsonNodeValue(context.root, pointer);
  return context;
}

export function wrap(text: string): string {
  return text.replace(new RegExp("\r\n", "g"), "\n");
}

export function assertStrictNodesEqual(node1: JsonNodeValue, node2: JsonNodeValue) {
  assert.strictEqual(node1.value, node2.value);
  assert.strictEqual(node1.pointer, node2.pointer);
}

export function assertStrictNodeEqual(
  node: JsonNodeValue | undefined,
  value: any,
  pointer: string
) {
  assert.strictEqual(node!.value, value);
  assert.strictEqual(node!.pointer, pointer);
}

export function ignoreJsonTextFeatures(text: string): string {
  return text.replace(new RegExp("}( )+\n", "g"), "}\n");
}

export function ignoreYamlTextFeatures(text: string): string {
  return text.replace(new RegExp(":( )+\n", "g"), ":\n");
}

export function assertTagsOrder(root: Parsed) {
  const asc = function (a: number, b: number) {
    return a - b;
  };
  const children = getRootAsJsonNodeValue(root)!.getChildren(true);
  const ids = children.map((child) => topTags.indexOf(child.getKey()));
  const idsSorted = [...ids].sort(asc);
  assert.notStrictEqual(idsSorted[0], -1);
  assert.deepStrictEqual(ids, idsSorted);

  const components = findJsonNodeValue(root, "/components");
  if (components) {
    const children = components.getChildren(true);
    if (children && children.length > 1) {
      const ids = children.map((child) => componentsTags.indexOf(child.getKey()));
      const idsSorted = [...ids].sort(asc);
      assert.notStrictEqual(idsSorted[0], -1);
      assert.deepStrictEqual(ids, idsSorted);
    }
  }
}

export async function testDeleteNode(
  file: string,
  expFile: string,
  languageId: string,
  version: OpenApiVersion,
  pointer: string
) {
  const text = readFileSync(resolve(__dirname, file), {
    encoding: "utf8",
  });
  const expected = readFileSync(resolve(__dirname, expFile), {
    encoding: "utf8",
  });
  await withRandomFileEditor(text, languageId, async (editor, doc) => {
    const root = safeParse(editor.document.getText(), editor.document.languageId);
    const bundle = { value: root };
    const edit = new vscode.WorkspaceEdit();
    const context: FixContext = {
      editor: editor,
      edit: edit,
      issues: [],
      fix: {
        problem: [],
        type: FixType.Delete,
        title: "",
      },
      bulk: false,
      snippet: false,
      auditContext: null,
      version: version,
      bundle: bundle,
      root: root,
      target: findJsonNodeValue(root, pointer),
      document: editor.document,
    };
    const deadRefs = getDeadRefs(pointer, context);
    assert.ok(deadRefs.length > 0);
    fixDelete(context);
    let pointers = deadRefs.map((ref) => ref.replace("#/", "/"));
    const compsToRemove = getPointersByComponents(pointers, version);
    const allComps = getPointersByComponents(getAllComponentPointers(root, version), version);
    for (const [c, cPointers] of Object.entries(compsToRemove)) {
      if (c in allComps && cmpSets(allComps[c], cPointers)) {
        pointers = pointers.filter((p) => !cPointers.has(p));
        pointers.push(version === OpenApiVersion.V3 ? "/components/" + c : "/" + c);
      }
    }
    context.pointersToRemove = new Set<string>(pointers);
    for (const pointer of pointers) {
      context.target = findJsonNodeValue(root, pointer);
      fixDelete(context);
    }
    fixDeleteApplyIfNeeded(context);
    return vscode.workspace.applyEdit(edit).then(() => {
      assert.ok(doc.isDirty);
      //console.info(doc.getText());
      assert.strictEqual(wrap(doc.getText()), wrap(expected));
    });
  });
}
