/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { HttpMethod } from "@xliic/openapi";

import { basename } from "path";
import { Cache } from "../../cache";
import { Configuration } from "../../configuration";
import { ensureHasCredentials } from "../../credentials";
import { ensureCliDownloaded } from "../../platform/cli-ast";
import { getOrCreateScanconfUri } from "../../platform/scan/config";
import { PlatformStore } from "../../platform/stores/platform-store";
import { Logger, PlatformContext } from "../../platform/types";
import { formatException } from "../../platform/util";
import { loadConfig } from "../../util/config";
import { existsUri } from "../../util/fs";
import { SignUpWebView } from "../../webapps/signup/view";
import { createGqlScanConfigWithCliBinary } from "../cli-ast-graphql";
import { ScanGqlWebView } from "./view";

export default (
  context: vscode.ExtensionContext,
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  logger: Logger,
  getScanView: (uri: vscode.Uri) => Promise<ScanGqlWebView>,
  getExistingReportView: null,
  signUpWebView: SignUpWebView,
) => {
  vscode.commands.registerTextEditorCommand(
    "openapi.graphql.editorRunFirstOperationScan",
    async (
      editor: vscode.TextEditor,
      edit: vscode.TextEditorEdit,
      uri: string,
      path: string,
      method: HttpMethod,
    ): Promise<void> => {
      try {
        await editorRunFirstOperationScan(
          signUpWebView,
          context.workspaceState,
          editor,
          cache,
          store,
          configuration,
          secrets,
          logger,
          getScanView,
          path,
          method,
        );
      } catch (ex: any) {
        vscode.window.showErrorMessage(formatException("Failed to scan:", ex));
      }
    },
  );
};

async function editorRunFirstOperationScan(
  signUpView: SignUpWebView,
  memento: vscode.Memento,
  editor: vscode.TextEditor,
  cache: Cache,
  store: PlatformStore,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  logger: Logger,
  getScanView: (uri: vscode.Uri) => Promise<ScanGqlWebView>,
  path: string,
  method: HttpMethod,
): Promise<void> {
  if (!(await ensureHasCredentials(signUpView, configuration, secrets, "regular"))) {
    return;
  }

  // run single operation scan creates the scan config and displays the scan view
  // actual execution of the scan triggered from the scan view
  const config = await loadConfig(configuration, secrets);

  // free users and platform users who chose to use CLI for scan must have CLI available
  if (
    (config.platformAuthType === "anond-token" ||
      (config.platformAuthType === "api-token" && config.scanRuntime === "cli")) &&
    !(await ensureCliDownloaded(configuration, secrets))
  ) {
    // cli is not available and user chose to cancel download
    vscode.window.showErrorMessage("42Crunch API Security Testing Binary is required to run Scan.");
    return;
  }

  const text = editor.document.getText();
  const title = basename(editor.document.fileName) || "GraphQL";
  const scanconfUri = await getOrCreateScanconfUri(editor.document.uri, title);
  const tags = [] as string[];

  if (
    (scanconfUri === undefined || !(await existsUri(scanconfUri))) &&
    !(await createDefaultScanConfig(
      editor.document,
      tags,
      store,
      cache,
      secrets,
      logger,
      config.platformAuthType,
      config.scanRuntime,
      config.cliDirectoryOverride,
      scanconfUri,
      text,
    ))
  ) {
    return;
  }

  const view = await getScanView(editor.document.uri);
  return view.sendScanOperation(text, editor.document, scanconfUri);
}

async function createDefaultScanConfig(
  document: vscode.TextDocument,
  tags: string[],
  store: PlatformStore,
  cache: Cache,
  secrets: vscode.SecretStorage,
  logger: Logger,
  platformAuthType: "api-token" | "anond-token",
  scanRuntime: "docker" | "scand-manager" | "cli",
  cliDirectoryOverride: string,
  scanconfUri: vscode.Uri,
  text: string,
): Promise<boolean> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Creating graphql scan configuration...",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<boolean> => {
      try {
        await createGqlScanConfigWithCliBinary(
          scanconfUri,
          text,
          tags,
          cliDirectoryOverride,
          logger,
        );

        vscode.window.showInformationMessage(
          `Saved API GraphQL Conformance Scan configuration to: ${scanconfUri.toString()}`,
        );

        return true;
      } catch (e: any) {
        vscode.window.showErrorMessage(
          "Failed to create default config, please run Audit to check your OpenAPI for errors: " +
            ("message" in e ? e.message : e.toString()),
        );
        return false;
      }
    },
  );
}
