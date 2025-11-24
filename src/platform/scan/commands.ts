/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { BundledSwaggerOrOasSpec, HttpMethod } from "@xliic/openapi";
import { stringify } from "@xliic/preserving-json-yaml-parser";

import { Cache } from "../../cache";
import { Configuration, configuration } from "../../configuration";
import { ensureHasCredentials } from "../../credentials";
import { OperationIdNode } from "../../outlines/nodes/operation-ids";
import { OperationNode } from "../../outlines/nodes/paths";
import { TagChildNode } from "../../outlines/nodes/tags";
import { getPathAndMethod } from "../../outlines/util";
import {
  createScanConfigWithCliBinary,
  ensureCliDownloaded,
  runAuditWithCliBinary,
} from "../cli-ast";
import { PlatformStore } from "../stores/platform-store";
import { Logger, PlatformContext } from "../types";
import { getOrCreateScanconfUri, getScanconfUri, getVaultUri } from "./config";
import { createScanConfigWithPlatform } from "./runtime/platform";
import { ScanWebView } from "./view";
import { formatException } from "../util";
import { loadConfig } from "../../util/config";
import { Bundle, OpenApiVersion } from "../../types";
import { SignUpWebView } from "../../webapps/signup/view";
import { getOpenApiVersion } from "../../parsers";
import { ScanReportWebView } from "./report-view";
import { existsUri } from "../../util/fs";

export default (
  context: vscode.ExtensionContext,
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  logger: Logger,
  getScanView: (uri: vscode.Uri) => Promise<ScanWebView>,
  getExistingReportView: (uri: vscode.Uri) => ScanReportWebView,
  signUpWebView: SignUpWebView
) => {
  vscode.commands.registerTextEditorCommand(
    "openapi.platform.editorRunSingleOperationScan",
    async (
      editor: vscode.TextEditor,
      edit: vscode.TextEditorEdit,
      uri: string,
      path: string,
      method: HttpMethod
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
          method
        );
      } catch (ex: any) {
        vscode.window.showErrorMessage(formatException("Failed to scan:", ex));
      }
    }
  );

  vscode.commands.registerCommand(
    "openapi.outlineSingleOperationScan",
    async (node: OperationNode | TagChildNode | OperationIdNode): Promise<void> => {
      if (!vscode.window.activeTextEditor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      const { path, method } = getPathAndMethod(node);

      try {
        await editorRunSingleOperationScan(
          signUpWebView,
          context.workspaceState,
          vscode.window.activeTextEditor,
          cache,
          store,
          configuration,
          secrets,
          logger,
          getScanView,
          path,
          method
        );
      } catch (ex: any) {
        vscode.window.showErrorMessage(formatException("Failed to scan:", ex));
      }
    }
  );

  vscode.commands.registerTextEditorCommand(
    "openapi.platform.editorRunFirstOperationScan",
    async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> => {
      const parsed = cache.getParsedDocument(editor.document);
      const supportedVersions = [OpenApiVersion.V2, OpenApiVersion.V3, OpenApiVersion.V3_1];
      if (supportedVersions.includes(getOpenApiVersion(parsed))) {
        const oas = parsed as unknown as BundledSwaggerOrOasSpec;

        const firstPath = Object.keys(oas.paths || {})[0];
        if (firstPath === undefined) {
          return undefined;
        }

        const firstMethod = Object.keys(oas.paths?.[firstPath] || {})[0];
        if (firstMethod === undefined) {
          return undefined;
        }

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
            firstPath,
            firstMethod as HttpMethod
          );
        } catch (ex: any) {
          vscode.window.showErrorMessage(formatException("Failed to scan:", ex));
        }
      }
    }
  );

  vscode.commands.registerTextEditorCommand(
    "openapi.platform.editorOpenScanconfig",
    async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> => {
      await editorOpenScanconfig(editor);
    }
  );

  vscode.commands.registerTextEditorCommand(
    "openapi.platform.exportScanReport",
    async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> => {
      const view = getExistingReportView(editor.document.uri);
      if (view === undefined) {
        vscode.window.showErrorMessage("No scan report found for the current document.");
        return;
      }

      const destination = await vscode.window.showSaveDialog({
        filters: { JSON: ["json"] },
      });

      if (destination !== undefined) {
        await view.exportReport(destination);
      }
    }
  );
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
  getScanView: (uri: vscode.Uri) => Promise<ScanWebView>,
  path: string,
  method: HttpMethod
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

  const bundle = await cache.getDocumentBundle(editor.document);

  if (!bundle || "errors" in bundle) {
    vscode.commands.executeCommand("workbench.action.problems.focus");
    vscode.window.showErrorMessage("Failed to bundle, check OpenAPI file for errors.");
    return;
  }

  const title = bundle?.value?.info?.title || "OpenAPI";
  const scanconfUri = await getOrCreateScanconfUri(editor.document.uri, title);
  const vaultUri = await getVaultUri(config);

  const tags = store.isConnected() ? await store.getTagsForDocument(editor.document, memento) : [];

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
      bundle
    ))
  ) {
    return;
  }

  const view = await getScanView(editor.document.uri);
  return view.sendScanOperation(bundle, editor.document, scanconfUri, vaultUri, path, method);
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
  bundle: Bundle
): Promise<boolean> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Creating scan configuration...",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<boolean> => {
      try {
        const oas = stringify(bundle.value);

        if (platformAuthType === "anond-token") {
          // free users must use CLI for scan, there is no need to fallback to anond for initial audit
          // if there is no CLI available, they will not be able to run scan or create a scan config in any case
          await createScanConfigWithCliBinary(scanconfUri, oas, tags, cliDirectoryOverride, logger);
        } else {
          if (scanRuntime === "cli") {
            await createScanConfigWithCliBinary(
              scanconfUri,
              oas,
              tags,
              cliDirectoryOverride,
              logger
            );
          } else {
            // this will run audit on the platform as well
            await createScanConfigWithPlatform(store, scanconfUri, oas);
          }
        }

        vscode.window.showInformationMessage(
          `Saved API Conformance Scan configuration to: ${scanconfUri.toString()}`
        );

        return true;
      } catch (e: any) {
        vscode.window.showErrorMessage(
          "Failed to create default config, please run Audit to check your OpenAPI for errors: " +
            ("message" in e ? e.message : e.toString())
        );
        return false;
      }
    }
  );
}

async function editorOpenScanconfig(editor: vscode.TextEditor): Promise<void> {
  const scanconfUri = await getScanconfUri(editor.document.uri);
  if (scanconfUri === undefined || !(await existsUri(scanconfUri))) {
    await vscode.window.showErrorMessage(
      "No scan configuration found for the current document. Please create one first by running a scan.",
      { modal: true }
    );
    return undefined;
  }

  await vscode.window.showTextDocument(scanconfUri);
}
