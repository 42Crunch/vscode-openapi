/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import {
  ScanRunConfig,
  OasWithOperationAndConfig,
  ShowScanReportMessage,
  SingleOperationScanReport,
  DocumentAndJsonPointer,
} from "@xliic/common/scan";

import { NamedEnvironment, replaceEnv } from "@xliic/common/env";
import { Preferences } from "@xliic/common/prefs";
import { Webapp } from "@xliic/common/webapp/scan";

import {
  ShowHttpResponseMessage,
  ShowHttpErrorMessage,
  HttpRequest,
  HttpError,
} from "@xliic/common/http";

import { WebView } from "../../web-view";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { executeHttpRequestRaw } from "../../tryit/http-handler";
import { getLocationByPointer } from "../../audit/util";

export class ScanWebView extends WebView<Webapp> {
  private document?: vscode.TextDocument;
  private isNewApi: boolean = false;

  hostHandlers: Webapp["hostHandlers"] = {
    runScan: async (config: ScanRunConfig): Promise<ShowScanReportMessage> => {
      try {
        return await runScan(
          this.store,
          this.envStore,
          config,
          this.configuration.get<string>("platformConformanceScanImage"),
          this.isNewApi
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
          vscode.window.showErrorMessage("Failed to run scan: " + ex.message);
        }
        throw ex;
      }
    },

    sendHttpRequest: async (
      request: HttpRequest
    ): Promise<ShowHttpResponseMessage | ShowHttpErrorMessage> => {
      try {
        const response = await executeHttpRequestRaw(request);
        return {
          command: "showHttpResponse",
          payload: response,
        };
      } catch (e) {
        return {
          command: "showHttpError",
          payload: e as HttpError,
        };
      }
    },

    sendCurlRequest: async (curl: string): Promise<void> => {
      return copyCurl(curl);
    },

    savePrefs: async (prefs: Preferences) => {
      this.prefs[this.document!.uri.toString()] = {
        ...this.prefs[this.document!.uri.toString()],
        ...prefs,
      };
    },

    showEnvWindow: async () => {
      vscode.commands.executeCommand("openapi.showEnvironment");
    },

    showJsonPointer: async (payload: DocumentAndJsonPointer) => {
      let editor: vscode.TextEditor | undefined = undefined;

      // check if document is already open
      for (const visibleEditor of vscode.window.visibleTextEditors) {
        if (visibleEditor.document.uri.toString() == payload.document) {
          editor = visibleEditor;
        }
      }

      if (!editor) {
        // if not already open, load and show it
        const document = await vscode.workspace.openTextDocument(
          vscode.Uri.parse(payload.document)
        );
        editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
      }

      const root = this.cache.getParsedDocument(editor.document);
      const lineNo = getLocationByPointer(editor.document, root, payload.jsonPointer)[0];
      const textLine = editor.document.lineAt(lineNo);
      editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
      editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
    },
  };

  constructor(
    extensionPath: string,
    private cache: Cache,
    private configuration: Configuration,
    private store: PlatformStore,
    private envStore: EnvStore,
    private prefs: Record<string, Preferences>
  ) {
    super(extensionPath, "scan", "Scan", vscode.ViewColumn.Two, false);
    envStore.onEnvironmentDidChange((env) => {
      if (this.isActive()) {
        this.sendRequest({
          command: "loadEnv",
          payload: { default: undefined, secrets: undefined, [env.name]: env.environment },
        });
      }
    });

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  async sendScanOperation(document: vscode.TextDocument, payload: OasWithOperationAndConfig) {
    this.document = document;
    this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
    const prefs = this.prefs[this.document.uri.toString()];
    if (prefs) {
      this.sendRequest({ command: "loadPrefs", payload: prefs });
    }
    return this.sendRequest({ command: "scanOperation", payload });
  }

  setNewApi() {
    this.isNewApi = true;
  }
}

async function runScan(
  store: PlatformStore,
  envStore: EnvStore,
  config: ScanRunConfig,
  scandImage: string,
  isNewApi: boolean
): Promise<ShowScanReportMessage> {
  const api = await store.createTempApi(config.rawOas);

  const audit = await store.getAuditReport(api.desc.id);
  if (audit?.openapiState !== "valid") {
    await store.deleteApi(api.desc.id);
    throw new Error(
      "OpenAPI has failed Security Audit. Please run API Security Audit, fix the issues and try running the Scan again."
    );
  }

  if (isNewApi) {
    await store.createScanConfigNew(api.desc.id, "updated", config.config);
  } else {
    await store.createScanConfig(api.desc.id, "updated", config.config);
  }

  const configs = await store.getScanConfigs(api.desc.id);

  const c = isNewApi
    ? await store.readScanConfig(configs[0].configuration.id)
    : await store.readScanConfig(configs[0].scanConfigurationId);

  const token = isNewApi ? c.token : c.scanConfigurationToken;

  const services = store.getConnection().services;

  const terminal = findOrCreateTerminal();

  const env: Record<string, string> = {};
  for (const [name, value] of Object.entries(config.env)) {
    env[name] = replaceEnv(value, await envStore.all());
  }

  env["SCAN_TOKEN"] = token;
  env["PLATFORM_SERVICE"] = services;

  const envString = Object.entries(env)
    .map(([key, value]) => `-e ${key}='${value}'`)
    .join(" ");

  terminal.sendText(`docker run --rm ${envString} ${scandImage}`);
  terminal.show();

  const reportId = await waitForReport(store, api.desc.id, 10000, isNewApi);

  const report = isNewApi
    ? await store.readScanReportNew(reportId!)
    : await store.readScanReport(reportId!);

  const parsed = JSON.parse(Buffer.from(report, "base64").toString("utf-8"));

  await store.deleteApi(api.desc.id);

  return {
    command: "showScanReport",
    // FIXME path and method are ignored by the UI, fix message to make 'em optionals
    payload: {
      path: "/",
      method: "get",
      report: parsed,
      security: undefined,
    },
  };
}

async function waitForReport(
  store: PlatformStore,
  apiId: string,
  maxDelay: number,
  isNewApi: boolean
): Promise<string | undefined> {
  let currentDelay = 0;
  while (currentDelay < maxDelay) {
    const reports = await store.listScanReports(apiId);
    if (reports.length > 0) {
      return isNewApi ? reports[0].report.taskId : reports[0].taskId;
    }
    console.log("Waiting for report to become available");
    await delay(1000);
  }
  console.log("Failed to read report");
  return undefined;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findOrCreateTerminal() {
  const name = "scan";
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === name && terminal.exitStatus === undefined) {
      return terminal;
    }
  }
  return vscode.window.createTerminal({ name });
}

async function runCurl(curl: string) {
  const terminal = findOrCreateTerminal();
  terminal.sendText(curl);
  terminal.show();
}

async function copyCurl(curl: string) {
  vscode.env.clipboard.writeText(curl);
  const disposable = vscode.window.setStatusBarMessage(`Curl command copied to the clipboard`);
  setTimeout(() => disposable.dispose(), 1000);
}
