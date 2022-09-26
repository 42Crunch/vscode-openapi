/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import {
  ScanRunConfig,
  OasWithOperationAndConfig,
  ScanRequest,
  ScanResponse,
  ShowScanReportMessage,
  ErrorMessage,
  ShowResponseMessage,
  ShowErrorMessage,
} from "@xliic/common/messages/scan";

import { EnvRequest, EnvResponse, NamedEnvironment, replaceEnv } from "@xliic/common/messages/env";
import { Preferences, PrefRequest, PrefResponse } from "@xliic/common/messages/prefs";

import { HttpRequest } from "@xliic/common/http";

import { WebView } from "../../web-view";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { executeHttpRequestRaw } from "../../tryit/http-handler";
import { stringify } from "@xliic/preserving-json-yaml-parser";
import { Configuration } from "../../configuration";
import { loadEnv, saveEnv } from "./env";

export class ScanWebView extends WebView<
  ScanRequest | EnvRequest | PrefRequest,
  ScanResponse | EnvResponse | PrefResponse
> {
  private document?: vscode.TextDocument;

  responseHandlers = {
    runScan: async (config: ScanRunConfig): Promise<ShowScanReportMessage> => {
      try {
        return await runScan(
          this.store,
          this.memento,
          this.secret,
          config,
          this.configuration.get<string>("platformConformanceScanImage")
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

    sendScanRequest: async (
      request: HttpRequest
    ): Promise<ShowResponseMessage | ShowErrorMessage> => {
      try {
        const response = await executeHttpRequestRaw(request);
        return {
          command: "showScanResponse",
          payload: response,
        };
      } catch (e) {
        return {
          command: "showError",
          payload: e as ErrorMessage,
        };
      }
    },

    sendCurlRequest: async (curl: string): Promise<void> => {
      return runCurl(curl);
    },

    saveEnv: async (env: NamedEnvironment) => {
      await saveEnv(this.memento, this.secret, env);
    },

    savePrefs: async (prefs: Preferences) => {
      this.prefs[this.document!.uri.toString()] = prefs;
    },
  };

  constructor(
    extensionPath: string,
    private cache: Cache,
    private configuration: Configuration,
    private store: PlatformStore,
    private memento: vscode.Memento,
    private secret: vscode.SecretStorage,
    private prefs: Record<string, Preferences>
  ) {
    super(extensionPath, "scan", "Scan", vscode.ViewColumn.Two);
  }

  async sendScanOperation(document: vscode.TextDocument, payload: OasWithOperationAndConfig) {
    this.document = document;
    const env = await loadEnv(this.memento, this.secret);
    this.sendRequest({ command: "loadEnv", payload: env });
    const prefs = this.prefs[this.document.uri.toString()];
    if (prefs) {
      this.sendRequest({ command: "loadPrefs", payload: prefs });
    }
    return this.sendRequest({ command: "scanOperation", payload });
  }
}

async function runScan(
  store: PlatformStore,
  memento: vscode.Memento,
  secret: vscode.SecretStorage,
  config: ScanRunConfig,
  scandImage: string
): Promise<ShowScanReportMessage> {
  const api = await store.createTempApi(stringify(config.oas));

  const audit = await store.getAuditReport(api.desc.id);
  if (audit?.openapiState !== "valid") {
    await store.deleteApi(api.desc.id);
    throw new Error(
      "OpenAPI has failed Security Audit. Please run API Security Audit, fix the issues and try running the Scan again."
    );
  }

  await store.createScanConfig(api.desc.id, "updated", config.config);

  const configs = await store.getScanConfigs(api.desc.id);

  const c = await store.readScanConfig(configs[0].scanConfigurationId);

  const token = c.scanConfigurationToken;

  const services = store.getConnection().services;

  const terminal = findOrCreateTerminal();

  const envData = await loadEnv(memento, secret);

  const env: Record<string, string> = {};
  for (const [name, value] of Object.entries(config.env)) {
    env[name] = replaceEnv(value, envData);
  }

  env["SCAN_TOKEN"] = token;
  env["PLATFORM_SERVICE"] = services;

  const envString = Object.entries(env)
    .map(([key, value]) => `-e ${key}='${value}'`)
    .join(" ");

  terminal.sendText(`docker run --rm ${envString} ${scandImage}`);
  terminal.show();

  const reportId = await waitForReport(store, api.desc.id, 10000);

  const report = await store.readScanReport(reportId!);
  const parsed = JSON.parse(Buffer.from(report, "base64").toString("utf-8"));

  await store.deleteApi(api.desc.id);

  return {
    command: "showScanReport",
    payload: parsed,
  };
}

async function runCurl(curl: string) {
  const terminal = findOrCreateTerminal();
  terminal.sendText(curl);
  terminal.show();
}

async function waitForReport(
  store: PlatformStore,
  apiId: string,
  maxDelay: number
): Promise<string | undefined> {
  let currentDelay = 0;
  while (currentDelay < maxDelay) {
    const reports = await store.listScanReports(apiId);
    if (reports.length > 0) {
      return reports[0].taskId;
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
