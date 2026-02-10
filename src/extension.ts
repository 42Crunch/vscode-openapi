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
import * as config from "./webapps/views/config/activate";
import * as capture from "./webapps/views/capture/activate";
import { PlatformStore } from "./platform/stores/platform-store";
import { Logger, PlatformConnection } from "./platform/types";
import { getPlatformCredentials, hasCredentials } from "./credentials";
import { EnvStore } from "./envstore";
import { debounce } from "./util/debounce";
import { getApprovedHostnamesTrimmedLowercase, removeSecretsForApprovedHosts } from "./util/config";
import { SignUpWebView } from "./webapps/signup/view";
import { PlatformCredentials } from "@xliic/common/signup";

const auditContext: AuditContext = {
  auditsByMainDocument: {},
  auditsByDocument: {},
  decorations: {},
  diagnostics: undefined as any,
  auditTempDirectories: {},
};

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

  const logOutputChannel = vscode.window.createOutputChannel(
    openapiExtension.packageJSON.displayName,
    { log: true },
  );

  const logger: Logger = {
    fatal: (message: string) => logOutputChannel.error(message),
    error: (message: string) => logOutputChannel.error(message),
    warning: (message: string) => logOutputChannel.warn(message),
    info: (message: string) => logOutputChannel.info(message),
    debug: (message: string) => logOutputChannel.debug(message),
    trace: (message: string) => logOutputChannel.trace(message),
    getLogLevel: () => {
      return logOutputChannel.logLevel;
    },
    isRedactionEnabled: () => {
      return !configuration.get<boolean>("internalDisableLogRedaction");
    },
  };

  const selectors = {
    json: { language: "json" },
    jsonc: { language: "jsonc" },
    yaml: { language: "yaml" },
  };

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
    parserOptions,
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

  yamlSchemaContributor.activate(context, cache, configuration);

  auditContext.auditsByMainDocument = {};
  auditContext.auditsByDocument = {};
  auditContext.decorations = {};
  auditContext.diagnostics = vscode.languages.createDiagnosticCollection("audits");
  auditContext.auditTempDirectories = {};

  const platformStore = new PlatformStore(configuration, logger);

  const envStore = new EnvStore(context.workspaceState, context.secrets);

  const prefs = {};
  const signUpWebView = new SignUpWebView(
    context.extensionPath,
    configuration,
    context.secrets,
    platformStore,
    logger,
  );
  const reportWebView = new AuditWebView(context.extensionPath, cache, configuration);
  audit.activate(
    context,
    auditContext,
    cache,
    logger,
    configuration,
    signUpWebView,
    reportWebView,
    platformStore,
  );
  preview.activate(context, cache, configuration);
  tryit.activate(context, cache, configuration, envStore, prefs);
  environment.activate(context, envStore);
  config.activate(context, configuration, context.secrets, platformStore, logger);
  capture.activate(context, configuration, context.secrets, platformStore, logger, signUpWebView);

  await platform.activate(
    context,
    auditContext,
    cache,
    configuration,
    context.secrets,
    platformStore,
    signUpWebView,
    reportWebView,
    context.workspaceState,
    envStore,
    prefs,
    logger,
  );

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(xliic-icon)";
  statusBarItem.command = "openapi.showSettings";
  statusBarItem.tooltip = "42Crunch Settings";
  statusBarItem.show();

  if (previousVersion!.major < currentVersion.major) {
    createWhatsNewPanel(context);
  }

  configuration.configure(context);
  yamlConfiguration.configure(context);

  if (vscode.window.activeTextEditor) {
    cache.onActiveEditorChanged(vscode.window.activeTextEditor);
  }

  const didCredentialsChangeEmitter = new vscode.EventEmitter<void>();
  const reloadCredentials = debounce(
    async () => {
      const credentials = await hasCredentials(configuration, context.secrets);
      if (credentials === "api-token") {
        const platformCredentials = await getPlatformCredentials(configuration, context.secrets);
        platformStore.setCredentials(platformCredentials);
        didCredentialsChangeEmitter.fire();
      } else {
        platformStore.setCredentials(undefined);
        didCredentialsChangeEmitter.fire();
      }
    },
    { delay: 3000 },
  );

  configuration.onDidChange(async (e: vscode.ConfigurationChangeEvent) => {
    if (
      configuration.changed(e, "platformAuthType") ||
      configuration.changed(e, "securityAuditToken") ||
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

  let approvedHostnames = getApprovedHostnamesTrimmedLowercase(configuration);

  const cleanupSecrets = debounce(
    async () => {
      const updatedApprovedHostnames = getApprovedHostnamesTrimmedLowercase(configuration);

      await removeSecretsForApprovedHosts(
        context.secrets,
        approvedHostnames.filter((name) => !updatedApprovedHostnames.includes(name)),
      );

      approvedHostnames = updatedApprovedHostnames;
    },
    { delay: 3000 },
  );

  configuration.onDidChange(async (e: vscode.ConfigurationChangeEvent) => {
    if (configuration.changed(e, "approvedHostnames")) {
      cleanupSecrets();
    }
  });

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider("xliic-mcp", {
      onDidChangeMcpServerDefinitions: didCredentialsChangeEmitter.event,
      provideMcpServerDefinitions: async () => {
        const platformCredentials = await getPlatformCredentials(configuration, context.secrets);

        if (!platformCredentials) {
          return [];
        }

        return [
          new vscode.McpStdioServerDefinition(
            "42 Crunch MCP",
            "/Users/anton/.42crunch/bin/42c-ast-mcp",
            ["mcp", "run"],
            {
              PLATFORM_HOST: platformCredentials.platformUrl,
              API_KEY: platformCredentials.apiToken!,
            },
          ),
        ];
      },
    }),
  );

  await reloadCredentials();
}

export async function deactivate() {
  await audit.deactivate(auditContext);
}
