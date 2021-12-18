import * as vscode from "vscode";
import { stringify } from "@xliic/preserving-json-yaml-parser";

import { PlatformStore } from "../stores/platform-store";
import { CollectionsProvider } from "../explorer/provider";
import { ExplorerNode } from "../explorer/nodes/base";
import { ApiNode } from "../explorer/nodes/api";
import { CollectionNode } from "../explorer/nodes/collection";
import { Cache } from "../../cache";
import got from "got";
import { ImportedUrlStore } from "../stores/imported-url-store";
import { getApiId } from "../util";
import { MAX_NAME_LEN } from "../types";

export default (
  store: PlatformStore,
  importedUrls: ImportedUrlStore,
  provider: CollectionsProvider,
  tree: vscode.TreeView<ExplorerNode>,
  cache: Cache
) => ({
  createApi: (collection: CollectionNode) => createApi(store, provider, tree, cache, collection),
  createApiFromUrl: (collection: CollectionNode) =>
    createApiFromUrl(store, importedUrls, provider, tree, cache, collection),
  editorReloadApiFromUrl: (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) =>
    reloadApiFromUrl(store, importedUrls, editor, edit),
});

async function createApi(
  store: PlatformStore,
  provider: CollectionsProvider,
  tree: vscode.TreeView<ExplorerNode>,
  cache: Cache,
  collection: CollectionNode
) {
  const uri = await vscode.window.showOpenDialog({
    openLabel: "Import API",
    title: "title",
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    // TODO use language filter from extension.ts
    filters: {
      OpenAPI: ["json", "yaml", "yml"],
    },
  });

  if (uri) {
    const document = await vscode.workspace.openTextDocument(uri[0]);

    // TODO handle bundling errors
    const bundle = await cache.getDocumentBundle(document);
    if (!bundle || "errors" in bundle) {
      return;
    }

    const title = mangle(bundle?.value?.info?.title ?? "OpenAPI");

    const json = stringify(bundle.value);

    const api = await store.createApi(collection.getCollectionId(), title, json);

    const apiNode = new ApiNode(collection, store, api);

    provider.refresh();
    tree.reveal(apiNode, { focus: true });
  }
}

async function createApiFromUrl(
  store: PlatformStore,
  importedUrls: ImportedUrlStore,
  provider: CollectionsProvider,
  tree: vscode.TreeView<ExplorerNode>,
  cache: Cache,
  collection: CollectionNode
) {
  const uri = await vscode.window.showInputBox({
    prompt: "Import API from URL",
  });

  if (uri) {
    const { body, headers } = await got(uri);

    const parsed = JSON.parse(body);

    const title = mangle(parsed?.info?.title ?? "OpenAPI");

    const api = await store.createApi(collection.getCollectionId(), title, body);
    importedUrls.setUrl(api.desc.id, uri);
    const apiNode = new ApiNode(collection, store, api);

    provider.refresh();
    tree.reveal(apiNode, { focus: true });
  }
}

async function reloadApiFromUrl(
  store: PlatformStore,
  importedUrls: ImportedUrlStore,
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit
) {
  // TODO check for dirty status of the document, and confirm contents to be overwritten
  const apiId = getApiId(editor.document.uri)!;
  const old = importedUrls.getUrl(apiId);

  const uri = await vscode.window.showInputBox({
    prompt: "Reload API from URL",
    value: old,
  });

  if (uri) {
    const { body, headers } = await got(uri);

    const parsed = JSON.parse(body);

    const text = JSON.stringify(parsed, null, 2);

    const range = editor.document.validateRange(new vscode.Range(0, 0, Number.MAX_SAFE_INTEGER, 0));

    editor.edit((edit) => {
      edit.replace(range, text);
    });
  }
}

function mangle(name: string) {
  return name.replace(/[^A-Za-z0-9_\\-\\.\\ ]/g, "-").substring(0, MAX_NAME_LEN);
}
