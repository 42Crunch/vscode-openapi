/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Config } from "@xliic/common/config";
import { EnvData, SimpleEnvironment } from "@xliic/common/env";
import { GeneralError } from "@xliic/common/error";
import { HttpMethod } from "@xliic/common/http";
import { LogLevel } from "@xliic/common/logging";
import { Preferences } from "@xliic/common/prefs";
import { ScandManagerConnection } from "@xliic/common/scan";
import { Webapp } from "@xliic/common/webapp/scanconf";
import { stringify } from "@xliic/preserving-json-yaml-parser";
import { readFileSync, writeFileSync } from "fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "path";
import { TextDecoder, TextEncoder } from "util";
import * as vscode from "vscode";
import { AuditWebView } from "../../audit/view";
import { Cache } from "../../cache";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { AuditContext, Bundle, MappingNode } from "../../types";
import { loadConfig } from "../../util/config";
import { extractSinglePath } from "../../util/extract";
import { WebView } from "../../web-view";
import * as managerApi from "../api-scand-manager";
import { ScandManagerJobStatus } from "../api-scand-manager";
import { PlatformStore } from "../stores/platform-store";
import { Logger } from "../types";
import { executeHttpRequest } from "./http-handler";
import { ScanReportWebView } from "./report-view";
import { runScanWithCliBinary } from "./runtime/cli-ast";

export type BundleDocumentVersions = Record<string, number>;

export type Target = {
  bundle: Bundle;
  document: vscode.TextDocument;
  documentUri: string;
  documentVersion: number;
  scanconfUri: vscode.Uri;
  //scanconfVersion: number;
  versions: BundleDocumentVersions;
  path: string;
  method: HttpMethod;
};

export class ScanWebView extends WebView<Webapp> {
  private document?: vscode.TextDocument;
  private auditReport?: {
    report: any;
    mapping: MappingNode;
  };
  private target?: Target;

  constructor(
    extensionPath: string,
    private cache: Cache,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private store: PlatformStore,
    private envStore: EnvStore,
    private prefs: Record<string, Preferences>,
    private auditView: AuditWebView,
    private reportView: ScanReportWebView,
    private auditContext: AuditContext
  ) {
    super(extensionPath, "scanconf", "Scan configuration", vscode.ViewColumn.One);
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

  hostHandlers: Webapp["hostHandlers"] = {
    saveScanconf: async (scanconf: string) => {
      try {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(this.target!.scanconfUri, encoder.encode(scanconf));
        // const document = this.target!.scanconf;
        // const workspaceEdit = new vscode.WorkspaceEdit();
        // const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
        // workspaceEdit.replace(document.uri, fullRange, scanconf);
        // await vscode.workspace.applyEdit(workspaceEdit);
        // await document.save();
      } catch (e) {
        console.log("e", e);
      }
    },

    runScan: async ({ path, method, operationId, env }): Promise<void> => {
      try {
        const config = await loadConfig(this.configuration, this.secrets);

        await this.reportView.show();
        await this.reportView.sendColorTheme(vscode.window.activeColorTheme);
        await this.reportView.sendStartScan(this.target!.document);

        return await runScan(
          this.store,
          this.envStore,
          env,
          this.target!.bundle,
          path,
          method,
          operationId,
          this.target!.scanconfUri,
          config,
          makeLogger(this.reportView),
          this.reportView
        );
      } catch (ex: any) {
        const message =
          ex?.response?.statusCode === 409 &&
          ex?.response?.body?.code === 109 &&
          ex?.response?.body?.message === "limit reached"
            ? "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
            : "Failed to run scan: " + ex.message;

        // return {
        //   command: "showGeneralError",
        //   payload: {
        //     message,
        //   },
        // };
      }
    },

    sendHttpRequest: ({ id, request, config }) => executeHttpRequest(id, request, config),

    // sendCurlRequest: async (curl: string): Promise<void> => {
    //   return copyCurl(curl);
    // },

    // savePrefs: async (prefs: Preferences) => {
    //   if (this.document) {
    //     const uri = this.document.uri.toString();
    //     this.prefs[uri] = {
    //       ...this.prefs[uri],
    //       ...prefs,
    //     };
    //   }
    // },

    showEnvWindow: async () => {
      vscode.commands.executeCommand("openapi.showEnvironment");
    },

    // showJsonPointer: async (payload: string) => {
    //   if (this.document) {
    //     let editor: vscode.TextEditor | undefined = undefined;

    //     // check if document is already open
    //     for (const visibleEditor of vscode.window.visibleTextEditors) {
    //       if (visibleEditor.document.uri.toString() === this.document.uri.toString()) {
    //         editor = visibleEditor;
    //       }
    //     }

    //     if (!editor) {
    //       editor = await vscode.window.showTextDocument(this.document, vscode.ViewColumn.One);
    //     }
    //     const root = this.cache.getParsedDocument(editor.document);
    //     const lineNo = getLocationByPointer(editor.document, root, payload)[0];
    //     const textLine = editor.document.lineAt(lineNo);
    //     editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
    //     editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
    //   }
    // },

    // showAuditReport: async () => {
    //   const uri = this.document!.uri.toString();
    //   const audit = await parseAuditReport(
    //     this.cache,
    //     this.document!,
    //     this.auditReport!.report,
    //     this.auditReport!.mapping
    //   );
    //   setAudit(this.auditContext, uri, audit);
    //   await this.auditView.showReport(audit);
    // },
  };

  onDispose(): void {
    this.document = undefined;
    super.onDispose();
  }

  // async sendStartScan(document: vscode.TextDocument) {
  //   this.document = document;
  //   this.auditReport = undefined;
  //   return this.sendRequest({ command: "startScan", payload: undefined });
  // }

  async sendScanOperation(
    bundle: Bundle,
    document: vscode.TextDocument,
    scanconfUri: vscode.Uri,
    path: string,
    method: HttpMethod
  ) {
    this.target = {
      bundle,
      document,
      documentUri: document.uri.toString(),
      documentVersion: document.version,
      versions: getBundleVersions(bundle),
      scanconfUri,
      method,
      path,
    };

    await this.show();
    await this.sendColorTheme(vscode.window.activeColorTheme);
    await this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
    // const prefs = this.prefs[this.target.documentUri];

    const content = await vscode.workspace.fs.readFile(scanconfUri);
    const scanconf = new TextDecoder("utf-8").decode(content);

    return this.sendRequest({
      command: "showScanconfOperation",
      payload: {
        oas: bundle.value,
        path: this.target.path,
        method: this.target.method,
        scanconf,
      },
    });
  }

  // async sendScanOperation(document: vscode.TextDocument, payload: OasWithOperationAndConfig) {
  //   this.document = document;
  //   this.auditReport = undefined;
  //   clearAudit(this.auditContext, this.document.uri.toString());
  //   this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
  //   this.sendLoadConfig();
  //   const prefs = this.prefs[this.document.uri.toString()];
  //   if (prefs) {
  //     this.sendRequest({ command: "loadPrefs", payload: prefs });
  //   }
  //   return this.sendRequest({ command: "scanOperation", payload });
  // }

  // async sendAuditError(document: vscode.TextDocument, report: any, mapping: MappingNode) {
  //   this.document = document;

  //   this.auditReport = {
  //     report,
  //     mapping,
  //   };

  //   return this.sendRequest({
  //     command: "showGeneralError",
  //     payload: {
  //       message:
  //         "OpenAPI has failed Security Audit. Please run API Security Audit, fix the issues and try running the Scan again.",
  //       code: "audit-error",
  //     },
  //   });
  // }

  // async sendLoadConfig() {
  //   const config = await loadConfig(this.configuration, this.secrets);
  //   this.sendRequest({
  //     command: "loadConfig",
  //     payload: config,
  //   });
  // }

  async sendLogMessage(message: string, level: LogLevel) {
    // this.sendRequest({
    //   command: "showLogMessage",
    //   payload: { message, level, timestamp: new Date().toISOString() },
    // });
  }

  // setNewApi(isNewApi: boolean) {
  //   this.isNewApi = isNewApi;
  // }
}

function makeLogger(view: { sendLogMessage: (message: string, level: LogLevel) => void }): Logger {
  return {
    debug: (message: string) => view.sendLogMessage(message, "debug"),
    info: (message: string) => view.sendLogMessage(message, "info"),
    warning: (message: string) => view.sendLogMessage(message, "warning"),
    error: (message: string) => view.sendLogMessage(message, "error"),
    fatal: (message: string) => view.sendLogMessage(message, "fatal"),
  };
}

async function runScan(
  store: PlatformStore,
  envStore: EnvStore,
  scanEnv: SimpleEnvironment,
  bundle: Bundle,
  path: string,
  method: HttpMethod,
  operationId: string,
  scanconfUri: vscode.Uri,
  config: Config,
  logger: Logger,
  reportView: ScanReportWebView
): Promise<void> {
  logger.info(`Starting API Conformance Scan`);

  const oas = extractSinglePath(path, bundle.value);

  const rawOas = stringify(oas);

  const content = await vscode.workspace.fs.readFile(scanconfUri);
  const scanconf = new TextDecoder("utf-8").decode(content);

  const trimmedScanconf = extractScanconf(scanconf, operationId);

  try {
    const parsed = await runScanWithCliBinary(
      envStore,
      scanEnv,
      config,
      logger,
      rawOas,
      trimmedScanconf
    );
    await reportView.showScanReport(path, method, parsed, oas);
  } catch (e: any) {
    await reportView.showGeneralError({ message: "Failed to execute scan: " + e.message });
  }

  // const tmpApi = await store.createTempApi(rawOas);

  // logger.info(`Created temp API "${tmpApi.apiId}", waiting for Security Audit`);

  // const audit = await store.getAuditReport(tmpApi.apiId);
  // if (audit?.data.openapiState !== "valid") {
  //   await store.clearTempApi(tmpApi);
  //   // return {
  //   //   command: "showGeneralError",
  //   //   payload: {
  //   //     message:
  //   //       "OpenAPI has failed Security Audit. Please run API Security Audit, fix the issues and try running the Scan again.",
  //   //   },
  //   // };s
  // }

  // logger.info(`Security Audit check is successful`);

  // await store.createScanConfigNew(tmpApi.apiId, "updated", trimmedScanconf);

  // const configs = await store.getScanConfigs(tmpApi.apiId);

  // const c = await store.readScanConfig(configs[0].configuration.id);

  // const token = c.token;

  // const failure =
  //   config.scanRuntime === "docker"
  //     ? await runScanWithDocker(envStore, scanEnv, config, logger, token)
  //     : await runScanWithScandManager(envStore, scanEnv, config, logger, token);

  // if (failure !== undefined) {
  //   // cleanup
  //   try {
  //     await store.clearTempApi(tmpApi);
  //   } catch (ex) {
  //     console.log(`Failed to cleanup temp api ${tmpApi.apiId}: ${ex}`);
  //   }

  //   reportView.showGeneralError(failure);
  // }

  // logger.info(`Waiting for scan report`);

  // const reportId = await waitForReport(store, tmpApi.apiId, 30000);

  // if (reportId === undefined) {
  //   reportView.showGeneralError({ message: "Failed to load scan report from the platform" });
  // }

  // const report = await store.readScanReportNew(reportId!);

  // const parsed = JSON.parse(Buffer.from(report, "base64").toString("utf-8"));

  // await store.clearTempApi(tmpApi);

  // logger.info(`Finished API Conformance Scan`);

  // await reportView.showScanReport(path, method, parsed, oas);
}

/*
async function waitForReport(
  store: PlatformStore,
  apiId: string,
  maxDelay: number
): Promise<string | undefined> {
  let currentDelay = 0;
  while (currentDelay < maxDelay) {
    const reports = await store.listScanReports(apiId);
    if (reports.length > 0) {
      return reports[0].report.taskId;
    }
    console.log("Waiting for report to become available");
    await delay(1000);
    currentDelay = currentDelay + 1000;
  }
  console.log("Failed to read report");
  return undefined;
}
*/

// async function runCurl(curl: string) {
//   const terminal = findOrCreateTerminal();
//   terminal.sendText(curl);
//   terminal.show();
// }

// async function copyCurl(curl: string) {
//   vscode.env.clipboard.writeText(curl);
//   const disposable = vscode.window.setStatusBarMessage(`Curl command copied to the clipboard`);
//   setTimeout(() => disposable.dispose(), 1000);
// }

export function replaceEnvOld(value: string, env: EnvData): string {
  const ENV_VAR_REGEX = /{{([\w\-$]+)}}/;
  const SECRETS_PREFIX = "secrets.";
  return value.replace(ENV_VAR_REGEX, (match: string, name: string): string => {
    if (name.startsWith(SECRETS_PREFIX)) {
      const key = name.substring(SECRETS_PREFIX.length, name.length);
      return env.secrets.hasOwnProperty(key) ? (env.secrets[key] as string) : match;
    }
    return env.default.hasOwnProperty(name) ? (env.default[name] as string) : match;
  });
}

function getBundleVersions(bundle: Bundle) {
  const versions: BundleDocumentVersions = {
    [bundle.document.uri.toString()]: bundle.document.version,
  };
  bundle.documents.forEach((document) => {
    versions[document.uri.toString()] = document.version;
  });
  return versions;
}

function extractScanconf(scanconf: string, operationId: string): string {
  const parsed: any = JSON.parse(scanconf);
  for (const key of Object.keys(parsed.operations)) {
    if (key !== operationId) {
      parsed.operations[key].scenarios = [];
    }
  }
  return JSON.stringify(parsed);
}
