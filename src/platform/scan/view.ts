/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { TextDecoder, TextEncoder } from "util";
import * as vscode from "vscode";

import { Config } from "@xliic/common/config";
import { EnvData, SimpleEnvironment } from "@xliic/common/env";
import { HttpMethod, BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { LogLevel } from "@xliic/common/logging";
import { Preferences } from "@xliic/common/prefs";
import { Webapp } from "@xliic/common/webapp/scanconf";
import { stringify } from "@xliic/preserving-json-yaml-parser";

import { AuditWebView } from "../../audit/view";
import { Cache } from "../../cache";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { AuditContext, Bundle, MappingNode } from "../../types";
import { loadConfig } from "../../util/config";
import { WebView } from "../../webapps/web-view";
import { PlatformStore } from "../stores/platform-store";
import { Logger } from "../types";
import { executeHttpRequest } from "../../webapps/http-handler";
import { ScanReportWebView } from "./report-view";
import {
  runScanWithCliBinary,
  runValidateScanConfigWithCliBinary,
  createDefaultConfigWithCliBinary,
  backupConfig,
} from "../cli-ast";
import { runScanWithDocker } from "./runtime/docker";
import { runScanWithScandManager } from "./runtime/scand-manager";
import { UPGRADE_WARN_LIMIT, offerUpgrade, warnOperationScans } from "../upgrade";
import { formatException } from "../util";
import { createDefaultConfigWithPlatform } from "./runtime/platform";
import { createTempDirectory } from "../../util/fs";
import { writeFile } from "fs/promises";

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
  private target?: Target;
  private tempApi?: { apiId: string; collectionId: string };

  constructor(
    title: string,
    extensionPath: string,
    private cache: Cache,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private store: PlatformStore,
    private envStore: EnvStore,
    private prefs: Record<string, Preferences>,
    private auditView: AuditWebView,
    private getReportView: () => ScanReportWebView,
    private auditContext: AuditContext
  ) {
    super(extensionPath, "scanconf", title, vscode.ViewColumn.One, "eye");
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

    runScan: async ({ path, method, operationId, env, scanconf }): Promise<void> => {
      try {
        const config = await loadConfig(this.configuration, this.secrets);

        const reportView = this.getReportView();
        await reportView.sendStartScan(this.target!.document);

        return await runScan(
          this.secrets,
          this.store,
          this.envStore,
          env,
          this.target!.bundle,
          path,
          method,
          scanconf,
          config,
          makeLogger(reportView),
          reportView,
          false
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

        const reportView = this.getReportView();

        await reportView.sendStartScan(this.target!.document);

        return await runScan(
          this.secrets,
          this.store,
          this.envStore,
          env,
          this.target!.bundle,
          undefined,
          undefined,
          scanconf,
          config,
          makeLogger(reportView),
          reportView,
          true
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

    sendHttpRequest: ({ id, request, config }) => executeHttpRequest(id, request, config),

    showEnvWindow: async () => {
      vscode.commands.executeCommand("openapi.showEnvironment");
    },

    openLink: async (url: string) => {
      vscode.env.openExternal(vscode.Uri.parse(url));
    },

    updateScanconf: async () => {
      try {
        const config = await loadConfig(this.configuration, this.secrets);
        const stringOas = stringify(this.target!.bundle.value);

        const scanconf =
          config.scanRuntime === "cli"
            ? await createDefaultConfigWithCliBinary(stringOas, config.cliDirectoryOverride)
            : await createDefaultConfigWithPlatform(this.store, stringOas);

        await backupConfig(this.target!.scanconfUri);

        this.sendRequest({
          command: "loadUpdatedScanconf",
          payload: { oas: this.target!.bundle.value, scanconf },
        });
      } catch (error: any) {
        this.sendRequest({
          command: "showGeneralError",
          payload: { message: `Failed to generate default scanconf: ${error.message}` },
        });
      }
    },
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
          oas: this.target.bundle.value,
          path: this.target.path,
          method: this.target.method,
          scanconf,
        },
      });
    }
  }

  async onDispose(): Promise<void> {
    await super.onDispose();
  }

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
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  envStore: EnvStore,
  scanEnv: SimpleEnvironment,
  bundle: Bundle,
  path: string | undefined,
  method: HttpMethod | undefined,
  scanconf: string,
  config: Config,
  logger: Logger,
  reportView: ScanReportWebView,
  isFullScan: boolean
): Promise<void> {
  logger.info(`Starting API Conformance Scan`);

  const oas: BundledSwaggerOrOasSpec = bundle.value;
  const stringOas = stringify(bundle.value);

  try {
    if (
      config.platformAuthType === "anond-token" ||
      (config.platformAuthType === "api-token" && config.scanRuntime === "cli")
    ) {
      const [validateReport, validateError] = await runValidateScanConfigWithCliBinary(
        secrets,
        envStore,
        scanEnv,
        config,
        logger,
        stringOas,
        scanconf,
        config.cliDirectoryOverride
      );

      if (validateError !== undefined) {
        throw new Error(
          `Unexpected error running scan config validation: ${JSON.stringify(validateError)}`
        );
      }

      if (validateReport.report.errors?.length) {
        await reportView.sendLogMessage("Scan configuration has failed validation", "error");
        for (const message of validateReport.report.errors) {
          await reportView.sendLogMessage(message, "error");
        }
        await reportView.sendLogMessage("Please fix the scan configuration and try again", "error");
        return;
      }

      const [result, error] = await runScanWithCliBinary(
        secrets,
        scanEnv,
        config,
        logger,
        stringOas,
        scanconf,
        isFullScan
      );

      if (error !== undefined) {
        if (error.statusCode === 3 && error.statusMessage === "limits_reached") {
          await offerUpgrade(isFullScan);
          return;
        } else {
          throw new Error(
            `Unexpected error running API Conformance Scan: ${JSON.stringify(error)}`
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

      if (isFullScan) {
        await reportView.showFullScanReport(result.scan, oas);
      } else {
        await reportView.showScanReport(path!, method!, result.scan, oas);
      }
    } else {
      const { token, tmpApi } = await createScanconfToken(store, stringOas, scanconf, logger);

      // fall back to docker if no anond token, and cli is configured
      const failure =
        config.scanRuntime === "scand-manager"
          ? await runScanWithScandManager(envStore, scanEnv, config, logger, token)
          : await runScanWithDocker(envStore, scanEnv, config, logger, token);

      if (failure !== undefined) {
        // cleanup
        try {
          await store.clearTempApi(tmpApi);
        } catch (ex) {
          console.log(`Failed to cleanup temp api ${tmpApi.apiId}: ${ex}`);
        }
        reportView.showGeneralError(failure);
        return;
      }

      const parsedReport = await loadReport(store, tmpApi, logger);
      await store.clearTempApi(tmpApi);
      logger.info(`Finished API API Conformance Scan`);

      if (parsedReport === undefined) {
        reportView.showGeneralError({ message: `Failed to load Scan report` });
        return;
      }

      // save report to a temporary directory
      const tempDir = createTempDirectory("scan-report");
      await writeFile(`${tempDir}/report.json`, JSON.stringify(parsedReport));
      reportView.setTemporaryReportDirectory(tempDir);

      if (isFullScan) {
        await reportView.showFullScanReport(parsedReport, oas);
      } else {
        await reportView.showScanReport(path!, method!, parsedReport, oas);
      }
    }
  } catch (e: any) {
    await reportView.showGeneralError({ message: "Failed to execute scan: " + e.message });
  }
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

function getBundleVersions(bundle: Bundle) {
  const versions: BundleDocumentVersions = {
    [bundle.document.uri.toString()]: bundle.document.version,
  };
  bundle.documents.forEach((document) => {
    versions[document.uri.toString()] = document.version;
  });
  return versions;
}

async function loadReport(
  store: PlatformStore,
  tmpApi: { apiId: string; collectionId: string },
  logger: Logger
) {
  const reportId = await waitForReport(store, tmpApi.apiId, 300000);
  if (reportId !== undefined) {
    const report = await store.readScanReportNew(reportId);
    const parsedReport = JSON.parse(Buffer.from(report, "base64").toString("utf-8"));
    return parsedReport;
  }
}

async function createScanconfToken(
  store: PlatformStore,
  oas: string,
  scanconf: string,
  logger: Logger
) {
  const tmpApi = await store.createTempApi(oas);
  logger.info(`Created temp API "${tmpApi.apiId}", waiting for Security Audit`);

  const audit = await store.getAuditReport(tmpApi.apiId);
  if (audit?.data.openapiState !== "valid") {
    await store.clearTempApi(tmpApi);
    throw new Error("API has failed Security Audit");
  }

  logger.info(`Security Audit check is successful`);

  await store.createScanConfigNew(tmpApi.apiId, "updated", scanconf);

  const configs = await store.getScanConfigs(tmpApi.apiId);

  const c = await store.readScanConfig(configs[0].configuration.id);

  const token = c.token;

  return { token, tmpApi };
}
