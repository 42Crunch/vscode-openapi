/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { TextDecoder, TextEncoder } from "util";
import * as vscode from "vscode";

import { Config } from "@xliic/common/config";
import { EnvData, SimpleEnvironment } from "@xliic/common/env";
import { LogLevel } from "@xliic/common/logging";
import { Preferences } from "@xliic/common/prefs";
import { Webapp } from "@xliic/common/webapp/scanconf-graphql";

import { Cache } from "../../cache";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { ScanReportWebView } from "../../platform/scan/report-view";
import { PlatformStore } from "../../platform/stores/platform-store";
import { Logger } from "../../platform/types";
import { UPGRADE_WARN_LIMIT, offerUpgrade, warnOperationScans } from "../../platform/upgrade";
import { formatException } from "../../platform/util";
import { loadConfig } from "../../util/config";
import { executeHttpRequest } from "../../webapps/http-handler";
import { WebView } from "../../webapps/web-view";
import { runGqlScanWithCliBinary } from "../cli-ast-graphql";

export type BundleDocumentVersions = Record<string, number>;

export type Target = {
  graphQl: string;
  document: vscode.TextDocument;
  documentUri: string;
  documentVersion: number;
  scanconfUri: vscode.Uri;
};

export class ScanGqlWebView extends WebView<Webapp> {
  private target?: Target;

  constructor(
    title: string,
    extensionPath: string,
    private cache: Cache,
    private logger: Logger,
    private configuration: Configuration,
    private memento: vscode.Memento,
    private secrets: vscode.SecretStorage,
    private store: PlatformStore,
    private envStore: EnvStore,
    private prefs: Record<string, Preferences>,
    private getReportView: () => Promise<ScanReportWebView>,
  ) {
    super(extensionPath, "scanconf-graphql", title, vscode.ViewColumn.One, "eye");
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
      } catch (e) {
        throw new Error("Failed to save scan configuration:" + e);
      }
    },

    savePrefs: async (prefs: Preferences) => {
      if (this.target) {
        const uri = this.target.document.uri.toString();
        this.prefs[uri] = {
          ...this.prefs[uri],
          ...prefs,
        };
      }
    },

    runScan: async ({ env, scanconf }): Promise<void> => {
      try {
        const config = await loadConfig(this.configuration, this.secrets);
        const reportView = await this.getReportView();
        await reportView.showReport(this.target!.document);
        return await runScan(
          this.secrets,
          this.store,
          this.envStore,
          env,
          this.target!.graphQl,
          scanconf,
          config,
          makeAggregateLogger(this.logger, reportView),
          reportView,
          false,
        );
      } catch (ex: any) {
        const message =
          ex?.response?.statusCode === 409 &&
          ex?.response?.body?.code === 109 &&
          ex?.response?.body?.message === "limit reached"
            ? "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
            : formatException("Failed to run scan:", ex);
        vscode.window.showErrorMessage(message);
      }
    },

    runFullScan: async ({ env, scanconf }): Promise<void> => {
      try {
        const config = await loadConfig(this.configuration, this.secrets);
        const reportView = await this.getReportView();
        await reportView.showReport(this.target!.document);
        return await runScan(
          this.secrets,
          this.store,
          this.envStore,
          env,
          this.target!.graphQl,
          scanconf,
          config,
          makeAggregateLogger(this.logger, reportView),
          reportView,
          true,
        );
      } catch (ex: any) {
        const message =
          ex?.response?.statusCode === 409 &&
          ex?.response?.body?.code === 109 &&
          ex?.response?.body?.message === "limit reached"
            ? "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
            : formatException("Failed to run scan:", ex);
        vscode.window.showErrorMessage(message);
      }
    },

    sendHttpRequest: ({ id, request, config }) =>
      executeHttpRequest(id, request, config, this.logger),

    showEnvWindow: async () => {
      vscode.commands.executeCommand("openapi.showEnvironment");
    },

    openLink: async (url: string) => {
      vscode.env.openExternal(vscode.Uri.parse(url));
    },

    updateScanconf: async () => {},
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    if (this.target) {
      await this.sendLoadConfig();
      await this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
      const prefs = this.prefs[this.target.document.uri.toString()];
      if (prefs) {
        await this.sendRequest({ command: "loadPrefs", payload: prefs });
      }
      const content = await vscode.workspace.fs.readFile(this.target.scanconfUri);
      const scanconf = new TextDecoder("utf-8").decode(content);
      await this.sendRequest({
        command: "showScanconfOperation",
        payload: {
          graphQl: this.target.graphQl,
          scanconf,
        },
      });
    }
  }

  async onDispose(): Promise<void> {
    await super.onDispose();
  }

  async sendScanOperation(graphQl: string, document: vscode.TextDocument, scanconfUri: vscode.Uri) {
    this.target = {
      graphQl,
      document,
      documentUri: document.uri.toString(),
      documentVersion: document.version,
      scanconfUri,
    };
    await this.show();
  }

  async sendLoadConfig() {
    const config = await loadConfig(this.configuration, this.secrets);
    this.sendRequest({
      command: "loadConfig",
      payload: config,
    });
  }

  async sendLogMessage(message: string, level: LogLevel) {}
}

function makeAggregateLogger(
  logger: Logger,
  view: {
    sendLogMessage: (message: string, level: LogLevel) => void;
  },
): Logger {
  return {
    trace: (message: string) => {
      logger.trace(message);
      // do not send trace messages to the view
    },
    debug: (message: string) => {
      logger.debug(message);
      // do not send debug messages to the view
    },
    info: (message: string) => {
      logger.info(message);
      view.sendLogMessage(message, "info");
    },
    warning: (message: string) => {
      logger.warning(message);
      view.sendLogMessage(message, "warning");
    },
    error: (message: string) => {
      logger.error(message);
      view.sendLogMessage(message, "error");
    },
    fatal: (message: string) => {
      logger.fatal(message);
      view.sendLogMessage(message, "fatal");
    },
    getLogLevel: () => {
      return logger.getLogLevel();
    },
    isRedactionEnabled: () => {
      return logger.isRedactionEnabled();
    },
  };
}

async function runScan(
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  envStore: EnvStore,
  scanEnv: SimpleEnvironment,
  graphQl: string,
  scanconf: string,
  config: Config,
  logger: Logger,
  reportView: ScanReportWebView,
  isFullScan: boolean,
): Promise<void> {
  logger.info(`Starting GraphQL API Conformance Scan`);

  try {
    if (
      config.platformAuthType === "anond-token" ||
      (config.platformAuthType === "api-token" && config.scanRuntime === "cli")
    ) {
      const [result, error] = await runGqlScanWithCliBinary(
        secrets,
        scanEnv,
        config,
        logger,
        graphQl,
        scanconf,
        isFullScan,
      );

      if (error !== undefined) {
        if (error.statusCode === 3 && error.statusMessage === "limits_reached") {
          await offerUpgrade();
          return;
        } else {
          throw new Error(
            `Unexpected error running API Conformance Scan: ${JSON.stringify(error)}`,
          );
        }
      }

      reportView.setTemporaryReportDirectory(result.tempScanDirectory);

      if (
        result.cli.remainingPerOperationScan !== undefined &&
        result.cli.remainingPerOperationScan < UPGRADE_WARN_LIMIT
      ) {
        warnOperationScans(result.cli.remainingPerOperationScan);
      }

      if (result.cli.scanLogs) {
        for (const entry of result.cli.scanLogs) {
          await reportView.sendLogMessage(entry.message, entry.level as LogLevel);
        }
      }

      await reportView.showScanReport(result.reportFilename);
    } else {
      logger.error(`GraphQL API Conformance Scan supports only CLI runtime`);
      reportView.showGeneralError({
        message: `GraphQL API Conformance Scan supports only CLI runtime`,
      });
    }
  } catch (e: any) {
    await reportView.showGeneralError({ message: "Failed to execute scan: " + e.message });
  }
}

async function waitForReport(
  store: PlatformStore,
  apiId: string,
  maxDelay: number,
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

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
