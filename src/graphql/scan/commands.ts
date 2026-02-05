/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { HttpMethod } from "@xliic/openapi";

import { Cache } from "../../cache";
import { Configuration } from "../../configuration";
import { ensureHasCredentials } from "../../credentials";
import { SignUpWebView } from "../../webapps/signup/view";
import { existsUri } from "../../util/fs";
import { formatException } from "../../platform/util";
import { Logger, PlatformContext } from "../../platform/types";
import { getOrCreateScanconfUri, getScanconfUri } from "../../platform/scan/config";
import { PlatformStore } from "../../platform/stores/platform-store";
import { createGqlScanConfigWithCliBinary } from "../cli-ast-graphql";
import { loadConfig } from "../../util/config";
import { basename } from "path";
import { ScanWebView } from "../../platform/scan/view";
import { ScanGqlWebView } from "./view";
import { ensureCliDownloaded } from "../../platform/cli-ast";

export default (
  context: vscode.ExtensionContext,
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  logger: Logger,
  getScanView: (uri: vscode.Uri) => Promise<ScanGqlWebView>,
  getExistingReportView: null, // (uri: vscode.Uri) => ScanReportWebView
  signUpWebView: SignUpWebView,
) => {
  vscode.commands.registerTextEditorCommand(
    "openapi.graphql.editorRunSingleOperationScan",
    async (
      editor: vscode.TextEditor,
      edit: vscode.TextEditorEdit,
      uri: string,
      path: string,
      method: HttpMethod,
    ): Promise<void> => {
      try {
        await editorRunSingleOperationScan(
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

  // vscode.commands.registerCommand(
  //   "openapi.outlineSingleOperationScan",
  //   async (node: OperationNode | TagChildNode | OperationIdNode): Promise<void> => {
  //     if (!vscode.window.activeTextEditor) {
  //       vscode.window.showErrorMessage("No active editor");
  //       return;
  //     }

  //     const { path, method } = getPathAndMethod(node);

  //     try {
  //       await editorRunSingleOperationScan(
  //         signUpWebView,
  //         context.workspaceState,
  //         vscode.window.activeTextEditor,
  //         cache,
  //         store,
  //         configuration,
  //         secrets,
  //         logger,
  //         getScanView,
  //         path,
  //         method,
  //       );
  //     } catch (ex: any) {
  //       vscode.window.showErrorMessage(formatException("Failed to scan:", ex));
  //     }
  //   },
  // );

  // vscode.commands.registerTextEditorCommand(
  //   "openapi.platform.editorOpenScanconfig",
  //   async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> => {
  //     await editorOpenScanconfig(editor);
  //   },
  // );

  // vscode.commands.registerTextEditorCommand(
  //   "openapi.platform.exportScanReport",
  //   async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> => {
  //     const view = getExistingReportView(editor.document.uri);
  //     if (view === undefined) {
  //       vscode.window.showErrorMessage("No scan report found for the current document.");
  //       return;
  //     }

  //     const destination = await vscode.window.showSaveDialog({
  //       filters: { JSON: ["json"] },
  //     });

  //     if (destination !== undefined) {
  //       await view.exportReport(destination);
  //     }
  //   },
  // );
};

async function editorRunSingleOperationScan(
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
  //console.info(">>> editorRunSingleOperationScan");

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

  const text = editor.document.getText(); // bundle = await cache.getDocumentBundle(editor.document);

  // if (!bundle || "errors" in bundle) {
  //   vscode.commands.executeCommand("workbench.action.problems.focus");
  //   vscode.window.showErrorMessage("Failed to bundle, check OpenAPI file for errors.");
  //   return;
  // }

  const title = basename(editor.document.fileName) || "OpenAPI";
  const scanconfUri = await getOrCreateScanconfUri(editor.document.uri, title);

  const tags = [] as string[]; //store.isConnected() ? await store.getTagsForDocument(editor.document, memento) : [];

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
  // todo: replace {} to graphql stuff
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

async function editorOpenScanconfig(editor: vscode.TextEditor): Promise<void> {
  const scanconfUri = await getScanconfUri(editor.document.uri);
  if (scanconfUri === undefined || !(await existsUri(scanconfUri))) {
    await vscode.window.showErrorMessage(
      "No scan configuration found for the current document. Please create one first by running a scan.",
      { modal: true },
    );
    return undefined;
  }

  await vscode.window.showTextDocument(scanconfUri);
}
