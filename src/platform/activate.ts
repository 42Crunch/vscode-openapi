/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Cache } from "../cache";
import { configuration } from "../configuration";
import { CollectionsProvider } from "./explorer/provider";
import { PlatformContext, platformUriScheme } from "./types";
import { AuditContext } from "../types";
import { registerCommands } from "./commands";
import { PlatformStore } from "./stores/platform-store";
import { FavoritesStore } from "./stores/favorites-store";
import { ImportedUrlStore } from "./stores/imported-url-store";
import { PlatformFS } from "./fs-provider";
import { isPlatformUri } from "./util";
import { CodelensProvider } from "./codelens";
import { refreshAuditReport } from "./audit";
import { AuditReportWebView } from "../audit/report";
import { ScanReportWebView } from "./scan-report";

export async function activate(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
  reportWebView: AuditReportWebView
) {
  const platformUrl = configuration.get<string>("platformUrl");

  let platformToken = undefined;
  try {
    platformToken = await context.secrets.get("platformApiToken");
  } catch (ex: any) {
    // secrets.get() sometimes throws an exception when running tests
    // ignore it
  }

  const scanReportView = new ScanReportWebView(context.extensionPath);

  const platformContext: PlatformContext = {
    context,
    memento: context.workspaceState,
    connection: {
      platformUrl: platformUrl,
      apiToken: platformToken,
    },
    logger: {
      fatal: (message: string) => null,
      error: (message: string) => null,
      warning: (message: string) => null,
      info: (message: string) => null,
      debug: (message: string) => null,
    },
  };

  const store = new PlatformStore(platformContext);
  const favoriteCollections = new FavoritesStore(context, platformContext);
  const importedUrls = new ImportedUrlStore(context);

  const platformFs = new PlatformFS(store);

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(platformUriScheme, platformFs, {
      isCaseSensitive: true,
    })
  );

  const provider = new CollectionsProvider(store, favoriteCollections, context.extensionUri);

  const tree = vscode.window.createTreeView("platformExplorer", {
    treeDataProvider: provider,
  });

  await vscode.commands.executeCommand(
    "setContext",
    "openapi.platform.credentials",
    platformUrl && platformToken ? "present" : "missing"
  );

  // TODO unsubscribe?

  const disposable1 = vscode.workspace.onDidSaveTextDocument((document) =>
    refreshAuditReport(store, cache, auditContext, document)
  );

  const disposable2 = vscode.workspace.onDidOpenTextDocument((document) =>
    refreshAuditReport(store, cache, auditContext, document)
  );

  const disposable3 = vscode.workspace.onDidSaveTextDocument((document) => {
    if (isPlatformUri(document.uri)) {
      // when API is saved, it's score might change so we need to refresh
      // explorer that shows API score
      vscode.commands.executeCommand("openapi.platform.refreshCollections");
    }
  });

  registerCommands(
    context,
    platformContext,
    auditContext,
    store,
    favoriteCollections,
    importedUrls,
    cache,
    provider,
    tree,
    reportWebView,
    scanReportView
  );

  vscode.languages.registerCodeLensProvider(
    [
      { scheme: platformUriScheme, language: "json" },
      { scheme: platformUriScheme, language: "jsonc" },
    ],
    new CodelensProvider(store)
  );
}
