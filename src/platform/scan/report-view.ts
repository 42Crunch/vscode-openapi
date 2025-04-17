/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { GeneralError } from "@xliic/common/error";
import { LogLevel } from "@xliic/common/logging";
import { Preferences } from "@xliic/common/prefs";
import { Webapp } from "@xliic/common/webapp/scan";
import { BundledSwaggerOrOasSpec, HttpMethod } from "@xliic/openapi";
import { rmdirSync, unlinkSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as vscode from "vscode";
import { getLocationByPointer } from "../../audit/util";
import { Cache } from "../../cache";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { existsSync } from "../../util/fs";
import { executeHttpRequest } from "../../webapps/http-handler";
import { WebView } from "../../webapps/web-view";
import { PlatformStore } from "../stores/platform-store";

export class ScanReportWebView extends WebView<Webapp> {
  private document?: vscode.TextDocument;
  private temporaryReportDirectory?: string;
  private file?: string;
  private report = "";
  private chunkId = 0;
  private chunkOffset = 0;
  private chunkSize = 0;

  constructor(
    title: string,
    extensionPath: string,
    private cache: Cache,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private store: PlatformStore,
    private envStore: EnvStore,
    private prefs: Record<string, Preferences>
  ) {
    super(extensionPath, "scan", title, vscode.ViewColumn.One, "eye");
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
    sendHttpRequest: ({ id, request, config }) => executeHttpRequest(id, request, config),

    sendCurlRequest: async (curl: string): Promise<void> => {
      return copyCurl(curl);
    },

    savePrefs: async (prefs: Preferences) => {
      if (this.document) {
        const uri = this.document.uri.toString();
        this.prefs[uri] = {
          ...this.prefs[uri],
          ...prefs,
        };
      }
    },

    showEnvWindow: async () => {
      vscode.commands.executeCommand("openapi.showEnvironment");
    },

    sendInitDbComplete: async (payload: { status: boolean; message: string }) => {
      this.report = await readFile(this.file as string, { encoding: "utf8" });
      this.chunkId = 0;
      this.chunkOffset = 0;
      this.chunkSize = 512 * 1024; //1024 * 1024; // 1mb Math.ceil(this.report.length / 100); // TODO: find out the best chunk size and hardoce it
      if (this.report.length <= this.chunkSize) {
        this.chunkSize = this.report.length;
      }
      const textSegment = this.report.substr(this.chunkOffset, this.chunkSize);
      this.chunkOffset += this.chunkSize;
      this.sendRequest({
        command: "parseChunk",
        payload: {
          id: this.chunkId,
          file: this.file as string,
          textSegment,
          progress: this.chunkOffset / this.report.length,
        },
      });
    },

    sendParseChunkComplete: async (payload: { id: number }) => {
      // console.info("GOT sendParseChunkComplete id = " + payload.id);
      if (this.chunkOffset < this.report.length && this.chunkId === payload.id && this.report) {
        if (this.report.length - this.chunkOffset < this.chunkSize) {
          this.chunkSize = this.report.length - this.chunkOffset;
        }
        const textSegment = this.report.substr(this.chunkOffset, this.chunkSize);
        this.chunkOffset += this.chunkSize;
        this.chunkId += 1;
        this.sendRequest({
          command: "parseChunk",
          payload: {
            id: this.chunkId,
            file: this.file as string,
            textSegment,
            progress: this.chunkOffset / this.report.length,
          },
        });
      }
    },

    showJsonPointer: async (payload: string) => {
      if (this.document) {
        let editor: vscode.TextEditor | undefined = undefined;

        // check if document is already open
        for (const visibleEditor of vscode.window.visibleTextEditors) {
          if (visibleEditor.document.uri.toString() === this.document.uri.toString()) {
            editor = visibleEditor;
          }
        }

        if (!editor) {
          editor = await vscode.window.showTextDocument(this.document, vscode.ViewColumn.One);
        }
        const root = this.cache.getParsedDocument(editor.document);
        const lineNo = getLocationByPointer(editor.document, root, payload)[0];
        const textLine = editor.document.lineAt(lineNo);
        editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
        editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
      }
    },
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
  }

  async onDispose(): Promise<void> {
    this.document = undefined;
    if (this.temporaryReportDirectory !== undefined) {
      await cleanupTempScanDirectory(this.temporaryReportDirectory);
    }
    await super.onDispose();
  }

  async sendStartScan(document: vscode.TextDocument) {
    this.document = document;
    await this.show();
    return this.sendRequest({ command: "startScan", payload: undefined });
  }

  async sendStartInitDb(file: string) {
    this.file = file;
    await this.show();
    return this.sendRequest({ command: "startInitDb", payload: undefined });
  }

  setTemporaryReportDirectory(dir: string) {
    this.temporaryReportDirectory = dir;
  }

  async sendLogMessage(message: string, level: LogLevel) {
    this.sendRequest({
      command: "showLogMessage",
      payload: { message, level, timestamp: new Date().toISOString() },
    });
  }

  async showGeneralError(error: GeneralError) {
    this.sendRequest({
      command: "showGeneralError",
      payload: error,
    });
  }

  async showScanReport(
    path: string,
    method: HttpMethod,
    report: unknown,
    oas: BundledSwaggerOrOasSpec
  ) {
    await this.sendRequest({
      command: "showScanReport",
      // FIXME path and method are ignored by the UI, fix message to make 'em optionals
      payload: {
        path,
        method,
        report: report as any,
        security: undefined,
        oas,
      },
    });
  }
  async showFullScanReport(report: unknown, oas: BundledSwaggerOrOasSpec) {
    await this.sendRequest({
      command: "showFullScanReport",
      // FIXME path and method are ignored by the UI, fix message to make 'em optionals
      payload: {
        report: report as any,
        security: undefined,
        oas,
      },
    });
  }

  async exportReport(destination: vscode.Uri) {
    const reportUri = vscode.Uri.file(join(this.temporaryReportDirectory!, "report.json"));
    vscode.workspace.fs.copy(reportUri, destination, { overwrite: true });
  }
}

async function copyCurl(curl: string) {
  vscode.env.clipboard.writeText(curl);
  const disposable = vscode.window.setStatusBarMessage(`Curl command copied to the clipboard`);
  setTimeout(() => disposable.dispose(), 1000);
}

async function cleanupTempScanDirectory(dir: string) {
  const oasFilename = join(dir, "openapi.json");
  const scanconfFilename = join(dir, "scanconf.json");
  const reportFilename = join(dir, "report.json");
  const graphqlFilename = join(dir, "schema.graphql");

  try {
    if (existsSync(oasFilename)) {
      unlinkSync(oasFilename);
    }
    if (existsSync(scanconfFilename)) {
      unlinkSync(scanconfFilename);
    }
    if (existsSync(reportFilename)) {
      unlinkSync(reportFilename);
    }
    if (existsSync(graphqlFilename)) {
      unlinkSync(graphqlFilename);
    }
    rmdirSync(dir);
  } catch (ex) {
    // ignore
  }
}
