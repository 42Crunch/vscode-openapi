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
import { AuditContext } from "../types";
import { CollectionsProvider } from "./explorer/provider";
import { ExplorerNode } from "./explorer/nodes/base";

export function registerCommands(
  context: vscode.ExtensionContext,
  platformContext: PlatformContext,
  auditContext: AuditContext,
  store: PlatformStore,
  favorites: FavoritesStore,
  importedUrls: ImportedUrlStore,
  cache: Cache,
  provider: CollectionsProvider,
  tree: vscode.TreeView<ExplorerNode>
): vscode.Disposable[] {
  const commands: any = {};
  Object.assign(commands, misc(store, favorites, provider, tree));
  Object.assign(commands, util(context, platformContext));
  Object.assign(commands, createApi(store, importedUrls, provider, tree, cache));
  Object.assign(commands, filter(store, provider));
  Object.assign(commands, report(store, context, auditContext, cache));

  return Object.keys(commands).map((name) => {
    const handler = commands[name];
    const id = `openapi.platform.${name}`;
    if (name.startsWith("editor")) {
      return vscode.commands.registerTextEditorCommand(id, handler);
    }
    return vscode.commands.registerCommand(id, handler);
  });
}
