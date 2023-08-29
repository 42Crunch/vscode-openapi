/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Preferences } from "@xliic/common/prefs";
import { Cache } from "../cache";
import { Configuration } from "../configuration";
import { CollectionsProvider } from "./explorer/provider";
import { Logger, PlatformContext, platformUriScheme } from "./types";
import { AuditContext } from "../types";
import { registerCommands } from "./commands";
import { PlatformStore } from "./stores/platform-store";
import { FavoritesStore } from "./stores/favorites-store";
import { ImportedUrlStore } from "./stores/imported-url-store";
import { PlatformFS } from "./fs-provider";
import { isPlatformUri } from "./util";
import { CodelensProvider } from "./codelens";
import { refreshAuditReport } from "./audit";
import { AuditWebView } from "../audit/view";
import { DataDictionaryWebView } from "./data-dictionary/view";
import { DataDictionaryCompletionProvider } from "./data-dictionary/completion";
import { DataDictionaryCodeActions } from "./data-dictionary/code-actions";
import { activate as activateLinter } from "./data-dictionary/linter";
import { activate as activateScan } from "./scan/activate";

import { EnvStore } from "../envstore";
import { PlaybookProvider } from "./playbook/explorer/provider";
import { PlaybookCodelensProvider } from "./playbook/lens";

export async function activate(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  reportWebView: AuditWebView,
  memento: vscode.Memento,
  envStore: EnvStore,
  prefs: Record<string, Preferences>,
  logger: Logger
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

  store.onConnectionDidChange(({ credentials }) =>
    vscode.commands.executeCommand(
      "setContext",
      "openapi.platform.credentials",
      credentials ? "present" : "missing"
    )
  );

  const playbookProvider = new PlaybookProvider(context, cache);

  const playbookTree = vscode.window.createTreeView("playbookExplorer", {
    treeDataProvider: playbookProvider,
  });

  const playbookCodelensProvider = new PlaybookCodelensProvider(cache);

  function activateLens(connected: boolean, enabled: boolean) {
    let disposables: vscode.Disposable[] = []; // todo: what?
    disposables.forEach((disposable) => disposable.dispose());
    if (connected && enabled) {
      disposables = Object.values(selectors).map((selector) =>
        vscode.languages.registerCodeLensProvider(selector, playbookCodelensProvider)
      );
    } else {
      disposables = [];
    }
  }

  store.onConnectionDidChange(({ connected }) => {
    activateLens(true, true);
    //activateLens(connected, configuration.get("codeLens"));
  });

  configuration.onDidChange(async (e: vscode.ConfigurationChangeEvent) => {
    if (configuration.changed(e, "codeLens")) {
      activateLens(true, true);
      //activateLens(store.isConnected(), configuration.get("codeLens"));
    }
  });
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

  activateScan(
    context,
    platformContext,
    cache,
    configuration,
    secrets,
    store,
    envStore,
    prefs,
    reportWebView,
    auditContext
  );
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
