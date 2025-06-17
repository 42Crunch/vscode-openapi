/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { GeneralError } from "@xliic/common/error";
import { HttpMethod, BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { LogLevel } from "@xliic/common/logging";
import { Preferences } from "@xliic/common/prefs";
import { Webapp } from "@xliic/common/webapp/scan";
import * as vscode from "vscode";
import { getLocationByPointer } from "../../audit/util";
import { Cache } from "../../cache";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { WebView } from "../../webapps/web-view";
import { PlatformStore } from "../stores/platform-store";
import { executeHttpRequest } from "../../webapps/http-handler";
import { join } from "node:path";
import { existsSync } from "../../util/fs";
import { rmdirSync, unlinkSync, createReadStream } from "node:fs";

export class ScanReportWebView extends WebView<Webapp> {
  private document?: vscode.TextDocument;
  private temporaryReportDirectory?: string;
  private chunksAbortController?: AbortController;
  private chunks?: AsyncGenerator<string, void, unknown>;

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

    parseChunkCompleted: async () => {
      // TODO
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

  async showReport(document: vscode.TextDocument) {
    this.document = document;
    await this.show();
  }

  async showScanReport(
    path: string,
    method: HttpMethod,
    reportFilename: string,
    oas: BundledSwaggerOrOasSpec
  ) {
    console.log("showScanReport", path, method, reportFilename);
    // await this.sendRequest({
    //   command: "showScanReport",
    //   // FIXME path and method are ignored by the UI, fix message to make 'em optionals
    //   payload: {
    //     path,
    //     method,
    //     //report: report as any,
    //     security: undefined,
    //     oas,
    //   },
    // });
  }
  async showFullScanReport(reportFilename: string, oas: BundledSwaggerOrOasSpec) {
    await this.sendRequest({
      command: "showFullScanReport",
      payload: {
        security: undefined,
        oas,
      },
    });

    this.chunksAbortController = new AbortController();
    this.chunks = readFileChunks(reportFilename, 1024, this.chunksAbortController.signal);
    const { value, done } = await this.chunks.next();
    await this.sendRequest({
      command: "parseChunk",
      payload: done ? null : value,
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

async function* readFileChunks(
  filePath: string,
  chunkSize = 1024,
  signal: AbortSignal | null = null
) {
  const stream = createReadStream(filePath, {
    highWaterMark: chunkSize,
    encoding: "utf8",
  });

  // Optional: abort stream if signal is aborted
  const abortHandler = () => {
    stream.destroy(new Error("Aborted by user"));
  };
  signal?.addEventListener("abort", abortHandler);

  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        break;
      }
      yield chunk;
    }
  } finally {
    stream.destroy(); // Clean up the stream
    signal?.removeEventListener("abort", abortHandler);
  }
}
