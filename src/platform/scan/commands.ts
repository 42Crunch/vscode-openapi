/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { HttpMethod } from "@xliic/common/http";
import { stringify } from "@xliic/preserving-json-yaml-parser";

import { Cache } from "../../cache";
import { Configuration } from "../../configuration";
import { ensureHasCredentials, getAnondCredentials } from "../../credentials";
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
import { offerUpgrade } from "../upgrade";
import { getScanconfUri } from "./config";
import { createScanConfigWithPlatform } from "./runtime/platform";
import { ScanWebView } from "./view";

export default (
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  getScanView: (uri: vscode.Uri) => ScanWebView
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
          editor,
          cache,
          store,
          configuration,
          secrets,
          getScanView,
          path,
          method
        );
      } catch (ex: any) {
        if (
          ex?.response?.statusCode === 409 &&
          ex?.response?.body?.code === 109 &&
          ex?.response?.body?.message === "limit reached"
        ) {
          vscode.window.showErrorMessage(
            "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
          );
        } else {
          vscode.window.showErrorMessage("Failed to scan: " + ex.message);
        }
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
          vscode.window.activeTextEditor,
          cache,
          store,
          configuration,
          secrets,
          getScanView,
          path,
          method
        );
      } catch (ex: any) {
        if (
          ex?.response?.statusCode === 409 &&
          ex?.response?.body?.code === 109 &&
          ex?.response?.body?.message === "limit reached"
        ) {
          vscode.window.showErrorMessage(
            "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
          );
        } else {
          vscode.window.showErrorMessage("Failed to scan: " + ex.message);
        }
      }
    }
  );
};

async function editorRunSingleOperationScan(
  editor: vscode.TextEditor,
  cache: Cache,
  store: PlatformStore,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  getScanView: (uri: vscode.Uri) => ScanWebView,
  path: string,
  method: HttpMethod
): Promise<void> {
  if (!(await ensureHasCredentials(configuration, secrets))) {
    return;
  }

  const hasCli = configuration.get("platformConformanceScanRuntime") === "cli";
  if (hasCli && !(await ensureCliDownloaded(configuration, secrets))) {
    // cli is not available and user chose to cancel download
    return;
  }

  const bundle = await cache.getDocumentBundle(editor.document);

  if (!bundle || "errors" in bundle) {
    vscode.commands.executeCommand("workbench.action.problems.focus");
    vscode.window.showErrorMessage("Failed to bundle, check OpenAPI file for errors.");
    return;
  }

  const title = bundle?.value?.info?.title || "OpenAPI";
  const scanconfUri = getScanconfUri(editor.document.uri, title);

  if (
    (scanconfUri === undefined || !(await exists(scanconfUri))) &&
    !(await createDefaultScanConfig(
      store,
      configuration,
      secrets,
      hasCli,
      scanconfUri,
      stringify(bundle.value)
    ))
  ) {
    return;
  }

  const view = getScanView(editor.document.uri);
  await view.show();
  await view.sendColorTheme(vscode.window.activeColorTheme);
  return view.sendScanOperation(bundle, editor.document, scanconfUri, path, method);
}

async function createDefaultScanConfig(
  store: PlatformStore,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  hasCli: boolean,
  scanconfUri: vscode.Uri,
  oas: string
): Promise<boolean> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Creating scan configuration...",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<boolean> => {
      try {
        if (hasCli && getAnondCredentials(configuration)) {
          //const oas = stringify(bundle.value);
          const [report, reportError] = await runAuditWithCliBinary(
            secrets,
            emptyLogger,
            oas,
            false
          );
          if (reportError !== undefined) {
            if (reportError.statusCode === 3 && reportError.statusMessage === "limits_reached") {
              await offerUpgrade();
              return false;
            } else {
              throw new Error(
                reportError.statusMessage ? reportError.statusMessage : JSON.stringify(reportError)
              );
            }
          }
          if ((report.audit as any).openapiState !== "valid") {
            throw new Error(
              "Your API has structural or semantic issues in its OpenAPI format. Run Security Audit on this file and fix these issues first."
            );
          }
          await createScanConfigWithCliBinary(scanconfUri, oas);
        } else {
          if (hasCli) {
            vscode.window.showInformationMessage(
              "Security Audit Token required by 42Crunch CLI is not found, using platform connection instead."
            );
          }
          await createScanConfigWithPlatform(store, scanconfUri, oas);
        }
        vscode.window.showInformationMessage(
          `Saved Conformance Scan configuration to: ${scanconfUri.toString()}`
        );
        return true;
      } catch (e: any) {
        vscode.window.showErrorMessage(
          "Failed to create default config: " + ("message" in e ? e.message : e.toString())
        );
        return false;
      }
    }
  );
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return true;
  } catch (e) {
    return false;
  }
}

const emptyLogger: Logger = {
  fatal: function (message: string): void {},
  error: function (message: string): void {},
  warning: function (message: string): void {},
  info: function (message: string): void {},
  debug: function (message: string): void {},
};
