/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { PlatformContext } from "../types";
import { stringify } from "@xliic/preserving-json-yaml-parser";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { HttpMethod } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { ScanWebView } from "./view";
import { extractSinglePath } from "../../util/extract";
import { basename, extname, join, dirname } from "path";
import { TextEncoder } from "util";
import { ScanReportWebView } from "./report-view";

export default (
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  view: ScanWebView
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
        await editorRunSingleOperationScan(editor, edit, cache, store, view, uri, path, method);
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
  edit: vscode.TextEditorEdit,
  cache: Cache,
  store: PlatformStore,
  view: ScanWebView,
  uri: string,
  path: string,
  method: HttpMethod
): Promise<void> {
  // FIXME await view.sendStartScan(editor.document);

  const bundle = await cache.getDocumentBundle(editor.document);
  if (bundle && !("errors" in bundle)) {
    // const oas = extractSinglePath(path as string, bundle.value);
    const rawOas = stringify(bundle.value);

    const scanconfUri = getScanconfUri(editor.document.uri);

    const isScanconfExists = await exists(scanconfUri);

    if (!isScanconfExists) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Creating default Conformance Scan configuration...",
          cancellable: false,
        },
        async () => {
          const tmpApi = await store.createTempApi(rawOas);

          const report = await store.getAuditReport(tmpApi.apiId);

          if (report?.data.openapiState !== "valid") {
            await store.clearTempApi(tmpApi);
            // await view.show();
            // FIXME await view.sendAuditError(editor.document, report.data, bundle.mapping);
            return;
          }

          await store.createDefaultScanConfig(tmpApi.apiId);

          const configs = await store.getScanConfigs(tmpApi.apiId);

          const isNewApi = configs[0].configuration !== undefined;

          const c = isNewApi
            ? await store.readScanConfig(configs[0].configuration.id)
            : await store.readScanConfig(configs[0].scanConfigurationId);

          const config = isNewApi
            ? JSON.parse(Buffer.from(c.file, "base64").toString("utf-8"))
            : JSON.parse(Buffer.from(c.scanConfiguration, "base64").toString("utf-8"));

          await store.clearTempApi(tmpApi);

          if (config !== undefined) {
            const uri = editor.document.uri;
            const filename = basename(uri.fsPath);
            const scanconfUri = uri.with({
              path: join(dirname(uri.fsPath), `${filename}.scanconf.json`),
            });

            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(
              scanconfUri,
              encoder.encode(JSON.stringify(config, null, 2))
            );
          }
        }
      );
    }

    await view.show();
    await view.sendColorTheme(vscode.window.activeColorTheme);
    return view.sendScanOperation(bundle, editor.document, scanconfUri, path, method);
  }
}

function getScanconfUri(openapiUri: vscode.Uri) {
  const filename = basename(openapiUri.fsPath);
  const scanconfUri = openapiUri.with({
    path: join(dirname(openapiUri.fsPath), `${filename}.scanconf.json`),
  });
  return scanconfUri;
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return true;
  } catch (e) {
    return false;
  }
}
