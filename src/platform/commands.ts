import * as vscode from "vscode";

import { Cache } from "../cache";
import { PlatformContext } from "./types";
import { PlatformStore } from "./stores/platform-store";
import { FavoritesStore } from "./stores/favorites-store";
import { ImportedUrlStore } from "./stores/imported-url-store";

import misc from "./commands/misc";
import util from "./commands/util";
import createApi from "./commands/create-api";
import filter from "./commands/fiter";
import report from "./commands/report";
import { AuditContext } from "../types";

export function registerCommands(
  context: vscode.ExtensionContext,
  platformContext: PlatformContext,
  auditContext: AuditContext,
  store: PlatformStore,
  favorites: FavoritesStore,
  importedUrls: ImportedUrlStore,
  cache: Cache
): vscode.Disposable[] {
  const { explorer } = platformContext;

  const commands = {};
  Object.assign(commands, misc(store, favorites, explorer.provider, explorer.tree));
  Object.assign(commands, util(context, platformContext));
  Object.assign(commands, createApi(store, importedUrls, explorer.provider, explorer.tree, cache));
  Object.assign(commands, filter(store, explorer.provider));
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
