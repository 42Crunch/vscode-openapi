/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { PlatformContext } from "../types";
import { parseJsonPointer, Path, simpleClone, stringify } from "@xliic/preserving-json-yaml-parser";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { HttpMethod } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { ScanWebView } from "./view";
import { parseAuditReport } from "../../audit/audit";
import { AuditWebView } from "../../audit/view";
import { extractSinglePath } from "../../util/extract";

export default (
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  view: ScanWebView,
  auditView: AuditWebView
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
          edit,
          cache,
          store,
          view,
          auditView,
          uri,
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
  edit: vscode.TextEditorEdit,
  cache: Cache,
  store: PlatformStore,
  view: ScanWebView,
  auditView: AuditWebView,
  uri: string,
  path: string,
  method: HttpMethod
): Promise<void> {
  await view.show();
  await view.sendColorTheme(vscode.window.activeColorTheme);

  const bundle = await cache.getDocumentBundle(editor.document);
  if (bundle && !("errors" in bundle)) {
    //const oas = extractSingleOperation(method as HttpMethod, path as string, bundle.value);
    // extracting the entire path here, 'cause scan will generate requests
    // for all possible HTTP Verbs and test the responses against the OAS
    const oas = extractSinglePath(path as string, bundle.value);
    const rawOas = stringify(oas);

    const api = await store.createTempApi(rawOas);

    const report = await store.getAuditReport(api.desc.id);

    if (report?.openapiState !== "valid") {
      // const audit = await parseAuditReport(cache, editor.document, report, {
      //   value: { uri, hash: "" },
      //   children: {},
      // });
      // await auditView.showReport(audit);

      await store.deleteApi(api.desc.id);
      throw new Error(
        "OpenAPI has failed Security Audit. Please run API Security Audit, fix the issues and try running the Scan again."
      );
    }

    await store.createDefaultScanConfig(api.desc.id);

    const configs = await store.getScanConfigs(api.desc.id);

    const isNewApi = configs[0].configuration !== undefined;

    const c = isNewApi
      ? await store.readScanConfig(configs[0].configuration.id)
      : await store.readScanConfig(configs[0].scanConfigurationId);

    const config = isNewApi
      ? JSON.parse(Buffer.from(c.file, "base64").toString("utf-8"))
      : JSON.parse(Buffer.from(c.scanConfiguration, "base64").toString("utf-8"));

    await store.deleteApi(api.desc.id);

    if (config !== undefined) {
      if (isNewApi) {
        view.setNewApi();
      }
      await view.show();
      await view.sendColorTheme(vscode.window.activeColorTheme);
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
