/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as semver from "semver";
import { configuration, Configuration } from "./configuration";
import { AuditContext, extensionQualifiedId } from "./types";
import { parserOptions } from "./parser-options";
import { registerOutlines } from "./outline";
import { JsonSchemaDefinitionProvider, YamlSchemaDefinitionProvider } from "./reference";
import {
  ExternalRefDocumentProvider,
  ApproveHostnameAction,
  registerAddApprovedHost,
  INTERNAL_SCHEMES,
} from "./external-refs";
import { CompletionItemProvider } from "./completion";
import { updateContext } from "./context";
import { registerCommands } from "./commands";
import { create as createWhatsNewPanel } from "./whatsnew";
import { Cache } from "./cache";
import { AuditWebView } from "./audit/view";

import * as yamlSchemaContributor from "./yaml-schema-contributor";
import * as audit from "./audit/activate";
import * as preview from "./preview";
import * as platform from "./platform/activate";
import * as tryit from "./tryit/activate";
import * as environment from "./environment/activate";
import * as config from "./webapps/config/activate";
import { PlatformStore } from "./platform/stores/platform-store";
import { Logger } from "./platform/types";
import { getPlatformCredentials } from "./credentials";
import { EnvStore } from "./envstore";
import { debounce } from "./util/debounce";
import { getApprovedHostnames, processApprovedHosts } from "./util/config";

export async function activate(context: vscode.ExtensionContext) {
  const versionProperty = "openapiVersion";
  const openapiExtension = vscode.extensions.getExtension(extensionQualifiedId)!;
  const currentVersion = semver.parse(openapiExtension.packageJSON.version)!;
  const previousVersion = context.globalState.get<string>(versionProperty)
    ? semver.parse(context.globalState.get<string>(versionProperty))
    : semver.parse("0.0.1");
  const yamlConfiguration = new Configuration("yaml");
  context.globalState.update(versionProperty, currentVersion.toString());
  parserOptions.configure(yamlConfiguration);

  const selectors = {
    json: { language: "json" },
    jsonc: { language: "jsonc" },
    yaml: { language: "yaml" },
  };

  // move old openapi.approvedHostnames configuration setting to the new model
  const moveOldApprovedHostnamesConfiguration = async () => {
    const oldApprovedHostnamesConfiguration = configuration.get<string[]|undefined>("approvedHostnames")?.map(host => host.trim());
    const newApprovedHostnamesConfiguration = await getApprovedHostnames(context.secrets);
    if (newApprovedHostnamesConfiguration.length == 0 && oldApprovedHostnamesConfiguration && oldApprovedHostnamesConfiguration.length >= 1) {
      await processApprovedHosts(context.secrets, oldApprovedHostnamesConfiguration.map( host => ({ host }) ));
    }
    if (oldApprovedHostnamesConfiguration) {
      configuration.update("approvedHostnames", undefined, vscode.ConfigurationTarget.Global);
    }
  };
  await moveOldApprovedHostnamesConfiguration();

  const externalRefProvider = new ExternalRefDocumentProvider(context.secrets);
  vscode.workspace.registerTextDocumentContentProvider(INTERNAL_SCHEMES.http, externalRefProvider);
  vscode.workspace.registerTextDocumentContentProvider(INTERNAL_SCHEMES.https, externalRefProvider);

  const cache = new Cache(parserOptions, Object.values(selectors), externalRefProvider);
  context.subscriptions.push(cache);

  cache.onDidActiveDocumentChange((document) => updateContext(cache, document));

  context.subscriptions.push(...registerOutlines(context, cache));
  context.subscriptions.push(...registerCommands(cache));
  context.subscriptions.push(registerAddApprovedHost(context));

  const completionProvider = new CompletionItemProvider(context, cache);
  for (const selector of Object.values(selectors)) {
    vscode.languages.registerCompletionItemProvider(selector, completionProvider, "#", "'", '"');
  }

  const jsonSchemaDefinitionProvider = new JsonSchemaDefinitionProvider(cache, externalRefProvider);
  const yamlSchemaDefinitionProvider = new YamlSchemaDefinitionProvider(
    cache,
    externalRefProvider,
    parserOptions
  );

  vscode.languages.registerDefinitionProvider(selectors.json, jsonSchemaDefinitionProvider);
  vscode.languages.registerDefinitionProvider(selectors.jsonc, jsonSchemaDefinitionProvider);
  vscode.languages.registerDefinitionProvider(selectors.yaml, yamlSchemaDefinitionProvider);

  const approveHostnameAction = new ApproveHostnameAction();
  for (const selector of Object.values(selectors)) {
    vscode.languages.registerCodeActionsProvider(selector, approveHostnameAction, {
      providedCodeActionKinds: ApproveHostnameAction.providedCodeActionKinds,
    });
  }

  vscode.window.onDidChangeActiveTextEditor((e) => cache.onActiveEditorChanged(e));
  vscode.workspace.onDidChangeTextDocument((e) => cache.onDocumentChanged(e));

  yamlSchemaContributor.activate(context, cache);

  const auditContext: AuditContext = {
    auditsByMainDocument: {},
    auditsByDocument: {},
    decorations: {},
    diagnostics: vscode.languages.createDiagnosticCollection("audits"),
  };

  const logger: Logger = {
    fatal: (message: string) => null,
    error: (message: string) => null,
    warning: (message: string) => null,
    info: (message: string) => null,
    debug: (message: string) => null,
  };

  const platformStore = new PlatformStore(configuration, logger);

  const envStore = new EnvStore(context.workspaceState, context.secrets);

  const prefs = {};

  const reportWebView = new AuditWebView(context.extensionPath, cache);
  audit.activate(context, auditContext, cache, configuration, reportWebView, platformStore);
  preview.activate(context, cache, configuration);
  tryit.activate(context, cache, configuration, envStore, prefs);
  environment.activate(context, envStore);
  config.activate(context, configuration, context.secrets, platformStore, logger);

  await platform.activate(
    context,
    auditContext,
    cache,
    configuration,
    context.secrets,
    platformStore,
    reportWebView,
    context.workspaceState,
    envStore,
    prefs,
    logger
  );

  if (previousVersion!.major < currentVersion.major) {
    createWhatsNewPanel(context);
  }

  configuration.configure(context);
  yamlConfiguration.configure(context);

  if (vscode.window.activeTextEditor) {
    cache.onActiveEditorChanged(vscode.window.activeTextEditor);
  }

  platformStore.setCredentials(await getPlatformCredentials(configuration, context.secrets));

  const reloadCredentials = debounce(
    async () => {
      platformStore.setCredentials(await getPlatformCredentials(configuration, context.secrets));
    },
    { delay: 3000 }
  );

  configuration.onDidChange(async (e: vscode.ConfigurationChangeEvent) => {
    if (
      configuration.changed(e, "platformUrl") ||
      configuration.changed(e, "platformServices") ||
      configuration.changed(e, "scandManagerUrl") ||
      configuration.changed(e, "scandManagerHeaderName") ||
      configuration.changed(e, "scandManagerHeaderValue")
    ) {
      reloadCredentials();
    }
  });

  context.secrets.onDidChange(async (e) => {
    if (e.key === "platformApiToken") {
      reloadCredentials();
    }
  });
}

export function deactivate() {}
