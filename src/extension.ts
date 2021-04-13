/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as semver from "semver";
import { configuration, Configuration } from "./configuration";
import { extensionQualifiedId } from "./types";
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

import * as yamlSchemaContributor from "./yaml-schema-contributor";
import * as audit from "./audit/activate";
import * as preview from "./preview";

export function activate(context: vscode.ExtensionContext) {
  const versionProperty = "openapiVersion";
  const openapiExtension = vscode.extensions.getExtension(extensionQualifiedId);
  const currentVersion = semver.parse(openapiExtension.packageJSON.version);
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

  const externalRefProvider = new ExternalRefDocumentProvider();
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
		if (selector.language === "yaml") {
			vscode.languages.registerCompletionItemProvider(selector, completionProvider, "'", '"');
		} else {
			vscode.languages.registerCompletionItemProvider(selector, completionProvider, '"');
		}
  }

  const jsonSchemaDefinitionProvider = new JsonSchemaDefinitionProvider(cache, externalRefProvider);
  const yamlSchemaDefinitionProvider = new YamlSchemaDefinitionProvider(cache, externalRefProvider);

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
  audit.activate(context, cache);
  preview.activate(context, cache);

  if (previousVersion.major < currentVersion.major) {
    createWhatsNewPanel(context);
  }

  configuration.configure(context);
  yamlConfiguration.configure(context);

  if (vscode.window.activeTextEditor) {
    cache.onActiveEditorChanged(vscode.window.activeTextEditor);
  }
}

export function deactivate() {}
