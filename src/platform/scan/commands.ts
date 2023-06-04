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
  await view.show();
  await view.sendColorTheme(vscode.window.activeColorTheme);
  await view.sendStartScan(editor.document);

  const bundle = await cache.getDocumentBundle(editor.document);
  if (bundle && !("errors" in bundle)) {
    const oas = extractSinglePath(path as string, bundle.value);
    const rawOas = stringify(oas);

    const tmpApi = await store.createTempApi(rawOas);

    const report = await store.getAuditReport(tmpApi.apiId);

    if (report?.data.openapiState !== "valid") {
      await store.clearTempApi(tmpApi);
      await view.show();
      await view.sendAuditError(editor.document, report.data, bundle.mapping);
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
      view.setNewApi(isNewApi);
      await view.show();
      await view.sendScanOperation(editor.document, {
        oas: oas as BundledSwaggerOrOasSpec,
        rawOas: rawOas,
        path: path as string,
        method: method as HttpMethod,
        config,
      });
    }
  }
}
