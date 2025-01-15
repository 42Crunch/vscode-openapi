/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got from "got";
import { execFile } from "node:child_process";
import { once } from "node:events";
import {
  chmodSync,
  createWriteStream,
  mkdirSync,
  mkdtempSync,
  rmdirSync,
  unlinkSync,
} from "node:fs";
import { writeFile, readFile, copyFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { finished } from "node:stream";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import * as vscode from "vscode";

import { CliDownloadProgress, CliTestResult, Config } from "@xliic/common/config";
import { SimpleEnvironment } from "@xliic/common/env";
import { Result } from "@xliic/result";
import { cliFreemiumdHost } from "@xliic/common/endpoints";

import { Configuration, configuration } from "../configuration";
import { getAnondCredentials, getPlatformCredentials } from "../credentials";
import { EnvStore } from "../envstore";
import { Logger } from "./types";
import { loadConfig } from "../util/config";
import { delay } from "../time-util";
import { CliAstManifestEntry, getCliUpdate } from "./cli-ast-update";
import { extensionQualifiedId } from "../types";
import { createTempDirectory, existsSync } from "../util/fs";

const asyncExecFile = promisify(execFile);

let lastCliUpdateCheckTime = 0;
const cliUpdateCheckInterval = 1000 * 60 * 60 * 1; // 1 hour
const execMaxBuffer = 1024 * 1024 * 20; // 20MB

export async function createScanConfigWithCliBinary(
  scanconfUri: vscode.Uri,
  oas: string,
  cliDirectoryOverride: string
): Promise<void> {
  const tmpdir = createTempDirectory("scan-");
  const oasFilename = join(tmpdir, "openapi.json");
  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());

  await writeFile(oasFilename, oas, { encoding: "utf8" });

  try {
    await asyncExecFile(
      cli,
      [
        "scan",
        "conf",
        "generate",
        "--output-format",
        "json",
        "--output",
        scanconfUri.fsPath,
        "openapi.json",
      ],
      { cwd: tmpdir, windowsHide: true, maxBuffer: execMaxBuffer }
    );

    // clean the temp directory
    unlinkSync(oasFilename);
    rmdirSync(tmpdir);
  } catch (ex: any) {
    throw new Error(formatException(ex));
  }
}

export async function createDefaultConfigWithCliBinary(
  oas: string,
  cliDirectoryOverride: string
): Promise<string> {
  const tmpdir = createTempDirectory("scanconf-update-");
  const scanconfFilename = join(tmpdir, "scanconf.json");
  const scanconfUri = vscode.Uri.file(scanconfFilename);
  await createScanConfigWithCliBinary(scanconfUri, oas, cliDirectoryOverride);
  const scanconf = await readFile(scanconfFilename, { encoding: "utf8" });
  unlinkSync(scanconfFilename);
  rmdirSync(tmpdir);
  return scanconf;
}

export async function backupConfig(scanconfUri: vscode.Uri): Promise<vscode.Uri> {
  const backup = join(dirname(scanconfUri.fsPath), "scanconf-backup.json");
  await copyFile(scanconfUri.fsPath, backup);
  return vscode.Uri.file(backup);
}

export function getCliInfo(cliDirectoryOverride: string): Config["cli"] {
  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());
  return { location: cli, found: existsSync(cli) };
}

export async function testCli(cliDirectoryOverride: string): Promise<CliTestResult> {
  const cli = getCliInfo(cliDirectoryOverride);

  if (cli.found) {
    try {
      const { stdout } = await asyncExecFile(cli.location, ["--version"], {
        windowsHide: true,
        maxBuffer: execMaxBuffer,
      });
      const version = stdout.split("\n")?.[0]; // get the first line only
      const match = version.match(/(\d+\.\d+\.\d+.*)$/);
      if (match !== null) {
        return { success: true, version: match[1] };
      }
      return { success: true, version: "0.0.0" };
    } catch (e: any) {
      return { success: false, message: String(e.message ? e.message : e) };
    }
  }
  return {
    success: false,
    message: "42Crunch API Security Testing Binary is not found",
  };
}

export async function ensureCliDownloaded(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<boolean> {
  const config = await loadConfig(configuration, secrets);
  const info = getCliInfo(config.cliDirectoryOverride);

  if (!info.found) {
    // offer to download
    await delay(100); // workaround for #133073
    const answer = await vscode.window.showInformationMessage(
      "42Crunch API Security Testing Binary is not found, download?",
      { modal: true },
      { title: "Download", id: "download" }
    );

    if (answer?.id === "download") {
      const manifest = await getCliUpdate(config.repository, "0.0.0");
      if (manifest === undefined) {
        vscode.window.showErrorMessage(
          "Failed to download 42Crunch API Security Testing Binary, manifest not found"
        );
        return false;
      }
      return downloadCliWithProgress(manifest, config.cliDirectoryOverride);
    }
    return false;
  }

  // check for CLI update
  const currentTime = Date.now();
  if (currentTime - lastCliUpdateCheckTime > cliUpdateCheckInterval) {
    lastCliUpdateCheckTime = currentTime;
    checkForCliUpdate(config.repository, config.cliDirectoryOverride);
  }

  return true;
}

export async function checkForCliUpdate(
  repository: string,
  cliDirectoryOverride: string
): Promise<boolean> {
  const test = await testCli(cliDirectoryOverride);
  if (test.success) {
    const manifest = await getCliUpdate(repository, test.version);
    if (manifest !== undefined) {
      await delay(100); // workaround for #133073
      const answer = await vscode.window.showInformationMessage(
        `New version ${manifest.version} of 42Crunch API Security Testing Binary is available, download?`,
        { modal: true },
        { title: "Download", id: "download" }
      );

      if (answer?.id === "download") {
        return downloadCliWithProgress(manifest, cliDirectoryOverride);
      }
    }
  }

  return false;
}

function downloadCliWithProgress(manifest: CliAstManifestEntry, cliDirectoryOverride: string) {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Downloading 42Crunch API Security Testing Binary",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<boolean> => {
      let previous = 0;
      for await (const downloadProgress of downloadCli(manifest, cliDirectoryOverride)) {
        const increment = (downloadProgress.percent - previous) * 100;
        previous = downloadProgress.percent;
        progress.report({ increment });
      }
      return true;
    }
  );
}

export async function* downloadCli(
  manifest: CliAstManifestEntry,
  cliDirectoryOverride: string
): AsyncGenerator<CliDownloadProgress, string, unknown> {
  ensureDirectories(cliDirectoryOverride);
  const tmpCli = yield* downloadToTempFile(manifest);
  const destinationCli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());
  await copyFile(tmpCli, destinationCli);
  unlinkSync(tmpCli);
  rmdirSync(dirname(tmpCli));
  if (process.platform === "linux" || process.platform === "darwin") {
    chmodSync(destinationCli, 0o755);
  }
  return destinationCli;
}

export async function runScanWithCliBinary(
  secrets: vscode.SecretStorage,
  scanEnv: SimpleEnvironment,
  config: Config,
  logger: Logger,
  oas: string,
  scanconf: string,
  isFullScan: boolean
): Promise<Result<{ scan: unknown; cli: CliResponse; tempScanDirectory: string }, CliError>> {
  logger.info(`Running API Conformance Scan using 42Crunch API Security Testing Binary`);

  const tmpDir = tmpdir();
  const dir = mkdtempSync(join(`${tmpDir}`, "scan-"));
  const oasFilename = join(dir as string, "openapi.json");
  const scanconfFilename = join(dir as string, "scanconf.json");
  const reportFilename = join(dir as string, "report.json");

  await writeFile(oasFilename, oas, { encoding: "utf8" });
  await writeFile(scanconfFilename, scanconf, { encoding: "utf8" });

  logger.info(`Wrote scan configuration to: ${dir}`);

  const cli = join(getBinDirectory(config.cliDirectoryOverride), getCliFilename());

  logger.info(`Running scan using: ${cli}`);

  const userAgent = getUserAgent();

  const args = [
    "scan",
    "run",
    "openapi.json",
    "--conf-file",
    "scanconf.json",
    "--output",
    "report.json",
    "--output-format",
    "json",
    "--freemium-host",
    cliFreemiumdHost,
    "--verbose",
    "error",
    "--user-agent",
    userAgent,
    "--enrich=false",
  ];

  if (!isFullScan) {
    args.push("--is-operation");
  }

  if (config.platformAuthType === "anond-token") {
    const anondToken = getAnondCredentials(configuration);
    args.push("--token", String(anondToken));
  } else {
    const platformConnection = await getPlatformCredentials(configuration, secrets);
    if (platformConnection !== undefined) {
      scanEnv["API_KEY"] = platformConnection.apiToken!;
      scanEnv["PLATFORM_HOST"] = platformConnection.platformUrl;
    }
  }

  const httpProxy = vscode.workspace.getConfiguration().get<string>("http.proxy");
  if (httpProxy !== undefined && httpProxy !== "") {
    scanEnv["HTTPS_PROXY"] = httpProxy;
  }

  try {
    const output = await asyncExecFile(cli, args, {
      cwd: dir as string,
      windowsHide: true,
      env: scanEnv,
      maxBuffer: execMaxBuffer,
    });

    const report = await readFile(reportFilename, { encoding: "utf8" });
    const parsed = JSON.parse(report);
    const cliResponse = parseCliJsonResponse(output.stdout);

    return [{ scan: parsed, cli: cliResponse!, tempScanDirectory: dir }, undefined];
  } catch (ex: any) {
    const error = readException(ex);
    const json = parseCliJsonResponse(error.stdout);
    if (json !== undefined) {
      return [undefined, json];
    } else {
      throw new Error(formatException(error));
    }
  }
}

export async function runValidateScanConfigWithCliBinary(
  secrets: vscode.SecretStorage,
  envStore: EnvStore,
  scanEnv: SimpleEnvironment,
  config: Config,
  logger: Logger,
  oas: string,
  scanconf: string,
  cliDirectoryOverride: string
): Promise<Result<CliValidateResponse, CliError>> {
  logger.info(`Running Validate Scan Config using 42Crunch API Security Testing Binary`);

  const tmpDir = tmpdir();
  const dir = mkdtempSync(join(`${tmpDir}`, "scan-"));
  const oasFilename = join(dir as string, "openapi.json");
  const scanconfFilename = join(dir as string, "scanconf.json");

  await writeFile(oasFilename, oas, { encoding: "utf8" });
  await writeFile(scanconfFilename, scanconf, { encoding: "utf8" });

  logger.info(`Wrote scan configuration to: ${dir}`);

  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());

  logger.info(`Running validate using: ${cli}`);

  try {
    const output = await asyncExecFile(
      cli,
      ["scan", "conf", "validate", "openapi.json", "--conf-file", "scanconf.json"],
      { cwd: dir as string, windowsHide: true, env: scanEnv, maxBuffer: execMaxBuffer }
    );

    const cliResponse = JSON.parse(output.stdout);

    // clean the temp directory
    unlinkSync(oasFilename);
    unlinkSync(scanconfFilename);
    rmdirSync(dir);

    return [cliResponse, undefined];
  } catch (ex: any) {
    const error = readException(ex);
    const json = parseCliJsonResponse(error.stdout);
    if (json !== undefined) {
      return [undefined, json];
    } else {
      throw new Error(formatException(error));
    }
  }
}

export async function runAuditWithCliBinary(
  secrets: vscode.SecretStorage,
  config: Config,
  logger: Logger,
  oas: string,
  tags: string[],
  isFullAudit: boolean,
  cliDirectoryOverride: string
): Promise<
  Result<
    {
      audit: unknown;
      todo: unknown;
      compliance: unknown;
      cli: CliResponse;
      tempAuditDirectory: string;
    },
    CliError
  >
> {
  logger.info(`Running Security Audit using 42Crunch API Security Testing Binary`);

  const dir = createTempDirectory("audit-");

  await writeFile(join(dir as string, "openapi.json"), oas, { encoding: "utf8" });

  logger.info(`Wrote Audit configuration to: ${dir}`);

  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());

  logger.info(`Running Security Audit using: ${cli}`);

  const userAgent = getUserAgent();

  const env: Record<string, string> = {};

  const args = [
    "audit",
    "run",
    "openapi.json",
    "--output",
    "report.json",
    "--output-format",
    "json",
    "--freemium-host",
    cliFreemiumdHost,
    "--verbose",
    "error",
    "--user-agent",
    userAgent,
    "--enrich=false",
  ];

  if (!isFullAudit) {
    args.push("--is-operation");
  }

  if (tags.length > 0) {
    args.push("--tag", tags.join(","));
  }

  if (config.platformAuthType === "anond-token") {
    const anondToken = getAnondCredentials(configuration);
    args.push("--token", String(anondToken));
  } else {
    const platformConnection = await getPlatformCredentials(configuration, secrets);
    if (platformConnection !== undefined) {
      env["API_KEY"] = platformConnection.apiToken!;
      env["PLATFORM_HOST"] = platformConnection.platformUrl;
    }
  }

  const httpProxy = vscode.workspace.getConfiguration().get<string>("http.proxy");
  if (httpProxy !== undefined && httpProxy !== "") {
    env["HTTPS_PROXY"] = httpProxy;
  }

  try {
    const output = await asyncExecFile(cli, args, {
      cwd: dir as string,
      windowsHide: true,
      env,
      maxBuffer: execMaxBuffer,
    });

    const openapiFilename = join(dir, "openapi.json");
    const reportFilename = join(dir, "report.json");
    const todoFilename = join(dir, "todo.json");
    const sqgFilename = join(dir, "sqg.json");

    const report = await readFile(reportFilename, { encoding: "utf8" });
    const parsed = JSON.parse(report);

    const todo = await readTodoReport(todoFilename);
    const compliance = await readSqgReport(sqgFilename);

    const cliResponse = JSON.parse(output.stdout);
    return [
      { audit: parsed, todo, compliance, cli: cliResponse, tempAuditDirectory: dir },
      undefined,
    ];
  } catch (ex: any) {
    if (ex.code === 3) {
      // limit reached
      const cliError = JSON.parse(ex.stdout);
      return [undefined, cliError];
    } else {
      const error = readException(ex);
      const json = parseCliJsonResponse(error.stdout);
      if (json !== undefined) {
        return [undefined, json];
      } else {
        throw new Error(formatException(error));
      }
    }
  }
}

function getCrunchDirectory() {
  if (process.platform === "win32") {
    return join(process.env["APPDATA"] || homedir(), "42Crunch");
  } else {
    return join(homedir(), ".42crunch");
  }
}

function getBinDirectory(cliDirectoryOverride: string) {
  if (cliDirectoryOverride !== undefined && cliDirectoryOverride !== "") {
    return cliDirectoryOverride;
  } else {
    return join(getCrunchDirectory(), "bin");
  }
}

function getCliFilename() {
  if (process.platform === "win32") {
    return "42c-ast.exe";
  } else {
    return "42c-ast";
  }
}

function ensureDirectories(cliDirectoryOverride: string) {
  mkdirSync(getBinDirectory(cliDirectoryOverride), { recursive: true });
}

async function* downloadToTempFile(
  manifest: CliAstManifestEntry
): AsyncGenerator<CliDownloadProgress, string, unknown> {
  const asyncFinished = promisify(finished);
  const cliFilename = getCliFilename();
  const tmpdir = createTempDirectory("42c-ast-download-");
  const tmpfile = join(tmpdir, cliFilename);
  const fileWriterStream = createWriteStream(tmpfile);
  const downloadStream = got.stream(manifest.downloadUrl);

  const hash = createHash("sha256");

  for await (const chunk of downloadStream) {
    yield downloadStream.downloadProgress;

    hash.update(chunk);
    if (!fileWriterStream.write(chunk)) {
      await once(fileWriterStream, "drain");
    }
  }

  fileWriterStream.end();
  await asyncFinished(fileWriterStream);

  if (manifest.sha256 !== hash.digest("hex")) {
    throw new Error(`SHA256 hash mismatch for ${manifest.downloadUrl}`);
  }

  return tmpfile;
}

function readException(ex: any) {
  const message = "message" in ex ? ex.message : "";
  const stdout = "stdout" in ex ? Buffer.from(ex.stdout, "utf8").toString() : "";
  const stderr = "stdout" in ex ? Buffer.from(ex.stderr, "utf8").toString() : "";
  return { message, stdout, stderr };
}

function formatException({
  message,
  stdout,
  stderr,
}: {
  message: string;
  stdout: string;
  stderr: string;
}) {
  return [message, stdout, stderr].filter((message) => message !== "").join("\n");
}

export type CliResponse = {
  statusCode: number;
  statusMessage: string;
  remainingPerOperationAudit?: number;
  remainingPerOperationScan?: number;
  scanLogs?: CliLogEntry[];
};

export type CliValidateResponse = {
  statusCode: number;
  statusMessage: string;
  report: {
    runnable: boolean;
    valid: boolean;
    errors?: string[];
  };
};

export type CliLogEntry = {
  time: string;
  level: string;
  message: string;
};

export type CliError = {
  statusCode: number;
  statusMessage: string;
};

function parseCliJsonResponse(response: string): CliResponse | undefined {
  try {
    if (response.startsWith("{")) {
      return JSON.parse(response);
    }
  } catch (ex) {
    // failed to parse json
  }

  return undefined;
}

function getUserAgent() {
  const extension = vscode.extensions.getExtension(extensionQualifiedId)!;
  return `42Crunch-VSCode/${extension.packageJSON.version}`;
}

async function readTodoReport(todoFilename: string) {
  if (existsSync(todoFilename)) {
    const report = await readFile(todoFilename, { encoding: "utf8" });
    return JSON.parse(report);
  }
}

async function readSqgReport(sqgReportFilename: string) {
  if (existsSync(sqgReportFilename)) {
    const report = await readFile(sqgReportFilename, { encoding: "utf8" });
    return JSON.parse(report);
  }
}
