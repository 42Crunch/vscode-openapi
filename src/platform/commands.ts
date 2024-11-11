import * as vscode from "vscode";

import { Cache } from "../cache";
import { PlatformContext } from "./types";
import { PlatformStore } from "./stores/platform-store";
import { FavoritesStore } from "./stores/favorites-store";
import { ImportedUrlStore } from "./stores/imported-url-store";

import misc from "./commands/misc";
import util from "./commands/util";
import createApi from "./commands/create-api";
import filter from "./commands/filter";
import report from "./commands/report";
import dataDictionary from "./data-dictionary/commands";

import { AuditContext } from "../types";
import { CollectionsProvider } from "./explorer/provider";
import { ExplorerNode } from "./explorer/nodes/base";
import { AuditWebView } from "../audit/view";
import { DataDictionaryWebView } from "./data-dictionary/view";
import { TagsWebView } from "../webapps/views/tags/view";
import { SignUpWebView } from "../webapps/signup/view";

export function registerCommands(
  context: vscode.ExtensionContext,
  platformContext: PlatformContext,
  auditContext: AuditContext,
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  favorites: FavoritesStore,
  importedUrls: ImportedUrlStore,
  cache: Cache,
  provider: CollectionsProvider,
  tree: vscode.TreeView<ExplorerNode>,
  reportWebView: AuditWebView,
  tagsWebView: TagsWebView,
  signUpWebView: SignUpWebView,
  dataDictionaryView: DataDictionaryWebView,
  dataDictionaryDiagnostics: vscode.DiagnosticCollection
): vscode.Disposable[] {
  const commands: any = {};
  Object.assign(commands, misc(store, favorites, provider, tree));
  Object.assign(commands, util(secrets, store, tagsWebView, signUpWebView));
  Object.assign(commands, createApi(store, importedUrls, provider, tree, cache));
  Object.assign(commands, filter(store, provider));
  Object.assign(commands, report(store, context, auditContext, cache, reportWebView));
  Object.assign(
    commands,
    dataDictionary(cache, platformContext, store, dataDictionaryView, dataDictionaryDiagnostics)
  );

  return Object.keys(commands).map((name) => {
    const handler = commands[name];
    const id = `openapi.platform.${name}`;
    if (name.startsWith("editor")) {
      return vscode.commands.registerTextEditorCommand(id, handler);
    }
    return vscode.commands.registerCommand(id, handler);
  });
}
