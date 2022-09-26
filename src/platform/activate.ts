/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Preferences } from "@xliic/common/messages/prefs";
import { Cache } from "../cache";
import { Configuration, configuration } from "../configuration";
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
import { DataDictionaryWebView } from "./data-dictionary/view";
import { DataDictionaryCompletionProvider } from "./data-dictionary/completion";
import { DataDictionaryCodeActions } from "./data-dictionary/code-actions";
import { activate as activateLinter } from "./data-dictionary/linter";
import { activate as activateScan } from "./scan/activate";

export async function activate(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
  configuration: Configuration,
  store: PlatformStore,
  reportWebView: AuditReportWebView,
  memento: vscode.Memento,
  secrets: vscode.SecretStorage,
  prefs: Record<string, Preferences>
) {
  const dataDictionaryView = new DataDictionaryWebView(context.extensionPath);

  const platformContext: PlatformContext = {
    context,
    memento,
  };

  const favoriteCollections = new FavoritesStore(context, store);
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

  store.onConnectionDidChange(({ connected }) =>
    vscode.commands.executeCommand(
      "setContext",
      "openapi.platform.credentials",
      connected ? "present" : "missing"
    )
  );

  // TODO unsubscribe?

  const selectors = {
    json: { language: "json" },
    jsonc: { language: "jsonc" },
    yaml: { language: "yaml" },
  };

  const dataDictionaryDiagnostics = vscode.languages.createDiagnosticCollection("data-dictionary");

  const completionProvider = new DataDictionaryCompletionProvider(store);
  for (const selector of Object.values(selectors)) {
    vscode.languages.registerCompletionItemProvider(selector, completionProvider, ":");
  }

  const codeActionsProvider = new DataDictionaryCodeActions(
    cache,
    store,
    dataDictionaryDiagnostics
  );
  for (const selector of Object.values(selectors)) {
    vscode.languages.registerCodeActionsProvider(selector, codeActionsProvider, {
      providedCodeActionKinds: DataDictionaryCodeActions.providedCodeActionKinds,
    });
  }

  activateScan(context, platformContext, cache, configuration, store, memento, secrets, prefs);
  activateLinter(cache, platformContext, store, dataDictionaryDiagnostics);

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
    dataDictionaryView,
    dataDictionaryDiagnostics
  );

  vscode.languages.registerCodeLensProvider(
    [
      { scheme: platformUriScheme, language: "json" },
      { scheme: platformUriScheme, language: "jsonc" },
    ],
    new CodelensProvider(store)
  );
}
