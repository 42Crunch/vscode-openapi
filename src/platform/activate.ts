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
import { CodelensProvider, PlatformTagCodelensProvider } from "./codelens";
import { refreshAuditReport } from "./audit";
import { AuditWebView } from "../audit/view";
import { DataDictionaryWebView } from "./data-dictionary/view";
import { DataDictionaryCompletionProvider } from "./data-dictionary/completion";
import { DataDictionaryCodeActions } from "./data-dictionary/code-actions";
import { activate as activateLinter } from "./data-dictionary/linter";
import { activate as activateScan } from "./scan/activate";
import { EnvStore } from "../envstore";
import { SignUpWebView } from "../webapps/signup/view";
import { TagsWebView } from "../webapps/views/tags/view";

export async function activate(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  signUpWebView: SignUpWebView,
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
    signUpWebView,
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

  const tagsWebView = new TagsWebView(
    context.extensionPath,
    memento,
    configuration,
    secrets,
    store,
    logger
  );

  registerCommands(
    context,
    platformContext,
    auditContext,
    secrets,
    store,
    favoriteCollections,
    importedUrls,
    cache,
    provider,
    tree,
    reportWebView,
    tagsWebView,
    signUpWebView,
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

  Object.values(selectors).map((selector) =>
    vscode.languages.registerCodeLensProvider(
      selector,
      new PlatformTagCodelensProvider(cache, configuration, secrets, memento)
    )
  );
}
