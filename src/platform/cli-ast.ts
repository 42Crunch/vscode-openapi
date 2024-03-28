/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got from "got";
import { execFile } from "node:child_process";
import { once } from "node:events";
import {
  accessSync,
  chmodSync,
  constants,
  createWriteStream,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmdirSync,
  unlinkSync,
} from "node:fs";
import { writeFile, readFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { finished } from "node:stream";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import * as vscode from "vscode";

import { CliDownloadProgress, CliTestResult, Config } from "@xliic/common/config";
import { SimpleEnvironment } from "@xliic/common/env";
import { Result } from "@xliic/result";

import { Configuration, configuration } from "../configuration";
import { getAnondCredentials, getPlatformCredentials, hasCredentials } from "../credentials";
import { EnvStore } from "../envstore";
import { Logger } from "./types";
import { loadConfig } from "../util/config";
import { delay } from "../time-util";
import { CliAstManifestEntry, getCliUpdate } from "./cli-ast-update";

const asyncExecFile = promisify(execFile);

let lastCliUpdateCheckTime = 0;
const cliUpdateCheckInterval = 1000 * 60 * 60 * 8; // 8 hours
let lastCliDownloadCheckTime = 0;
const cliDownloadCheckInterval = 1000 * 60 * 60 * 48; // 48 hours

export async function createScanConfigWithCliBinary(
  scanconfUri: vscode.Uri,
  oas: string
): Promise<void> {
  const tmpdir = createTempDirectory("scan-");
  const oasFilename = join(tmpdir, "openapi.json");
  const cli = join(getBinDirectory(), getCliFilename());

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
      { cwd: tmpdir, windowsHide: true }
    );

    // clean the temp directory
    unlinkSync(oasFilename);
    rmdirSync(tmpdir);
  } catch (ex: any) {
    throw new Error(formatException(ex));
  }
}

export function getCliInfo(): Config["cli"] {
  const cli = join(getBinDirectory(), getCliFilename());
  return { location: cli, found: exists(cli) };
}

export async function testCli(): Promise<CliTestResult> {
  const cli = getCliInfo();

  if (cli.found) {
    try {
      const { stdout } = await asyncExecFile(cli.location, ["--version"], { windowsHide: true });
      const version = stdout.split("\n")?.[0]; // get the first line only
      const match = version.match(/(\d+\.\d+\.\d+)$/);
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
    message: "CLI is not found",
  };
}

export async function ensureCliDownloaded(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<boolean> {
  const config = await loadConfig(configuration, secrets);
  const info = getCliInfo();

  if (!info.found) {
    // check if we already offered to download

    const currentTime = Date.now();
    if (currentTime - lastCliDownloadCheckTime < cliDownloadCheckInterval) {
      lastCliDownloadCheckTime = currentTime;
      return false;
    }

    // offer to download
    await delay(100); // workaround for #133073
    const answer = await vscode.window.showInformationMessage(
      "42Crunch CLI is not found, download?",
      { modal: true },
      { title: "Download", id: "download" }
    );

    if (answer?.id === "download") {
      const manifest = await getCliUpdate(config.repository, "0.0.0");
      if (manifest === undefined) {
        vscode.window.showErrorMessage("Failed to download 42Crunch CLI, manifest not found");
        return false;
      }
      return downloadCliWithProgress(manifest);
    }
    return false;
  }

  // check for CLI update
  const currentTime = Date.now();
  if (currentTime - lastCliUpdateCheckTime > cliUpdateCheckInterval) {
    lastCliUpdateCheckTime = currentTime;
    checkForCliUpdate(config.repository);
  }

  return true;
}

async function checkForCliUpdate(repository: string): Promise<boolean> {
  const test = await testCli();
  if (test.success) {
    const manifest = await getCliUpdate(repository, test.version);
    if (manifest !== undefined) {
      await delay(100); // workaround for #133073
      const answer = await vscode.window.showInformationMessage(
        `New version ${manifest.version} of 42Crunch CLI is available, download?`,
        { modal: true },
        { title: "Download", id: "download" }
      );

      if (answer?.id === "download") {
        return downloadCliWithProgress(manifest);
      }
    }
  }

  return false;
}

function downloadCliWithProgress(manifest: CliAstManifestEntry) {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Downloading 42Crunch CLI",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<boolean> => {
      let previous = 0;
      for await (const downloadProgress of downloadCli(manifest)) {
        const increment = (downloadProgress.percent - previous) * 100;
        previous = downloadProgress.percent;
        progress.report({ increment });
      }
      return true;
    }
  );
}

export async function* downloadCli(
  manifest: CliAstManifestEntry
): AsyncGenerator<CliDownloadProgress, string, unknown> {
  ensureDirectories();
  const tmpCli = yield* downloadToTempFile(manifest);
  const destinationCli = join(getBinDirectory(), getCliFilename());
  renameSync(tmpCli, destinationCli);
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
  isSingleOperationScan: boolean
): Promise<Result<{ scan: unknown; cli: CliResponse }, CliError>> {
  logger.info(`Running Conformance Scan using 42Crunch CLI`);

  const tmpDir = tmpdir();
  const dir = mkdtempSync(join(`${tmpDir}`, "scan-"));
  const oasFilename = join(dir as string, "openapi.json");
  const scanconfFilename = join(dir as string, "scanconf.json");
  const reportFilename = join(dir as string, "report.json");

  await writeFile(oasFilename, oas, { encoding: "utf8" });
  await writeFile(scanconfFilename, scanconf, { encoding: "utf8" });

  logger.info(`Wrote scan configuration to: ${dir}`);

  const cli = join(getBinDirectory(), getCliFilename());

  logger.info(`Running scan using: ${cli}`);

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
    "--verbose",
    "error",
    "--enrich=false",
  ];

  if (isSingleOperationScan) {
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

  try {
    const output = await asyncExecFile(cli, args, {
      cwd: dir as string,
      windowsHide: true,
      env: scanEnv,
    });

    const report = await readFile(reportFilename, { encoding: "utf8" });
    const parsed = JSON.parse(report);
    const cliResponse = parseCliJsonResponse(output.stdout);

    // clean the temp directory
    unlinkSync(oasFilename);
    unlinkSync(scanconfFilename);
    unlinkSync(reportFilename);
    rmdirSync(dir);

    return [{ scan: parsed, cli: cliResponse! }, undefined];
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
  scanconf: string
): Promise<Result<CliValidateResponse, CliError>> {
  logger.info(`Running Validate Scan Config using 42Crunch CLI`);

  const tmpDir = tmpdir();
  const dir = mkdtempSync(join(`${tmpDir}`, "scan-"));
  const oasFilename = join(dir as string, "openapi.json");
  const scanconfFilename = join(dir as string, "scanconf.json");

  await writeFile(oasFilename, oas, { encoding: "utf8" });
  await writeFile(scanconfFilename, scanconf, { encoding: "utf8" });

  logger.info(`Wrote scan configuration to: ${dir}`);

  const cli = join(getBinDirectory(), getCliFilename());

  logger.info(`Running validate using: ${cli}`);

  try {
    const output = await asyncExecFile(
      cli,
      ["scan", "conf", "validate", "openapi.json", "--conf-file", "scanconf.json"],
      { cwd: dir as string, windowsHide: true, env: scanEnv }
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
  logger: Logger,
  oas: string,
  isSingleOperationAudit: boolean
): Promise<Result<{ audit: unknown; cli: CliResponse }, CliError>> {
  logger.info(`Running Security Audit using 42Crunch CLI`);

  const dir = createTempDirectory("audit-");

  await writeFile(join(dir as string, "openapi.json"), oas, { encoding: "utf8" });

  logger.info(`Wrote Audit configuration to: ${dir}`);

  const cli = join(getBinDirectory(), getCliFilename());

  logger.info(`Running Security Audit using: ${cli}`);

  // CLI audits currently used only by free users
  const token = getAnondCredentials(configuration);

  try {
    const output = await asyncExecFile(
      cli,
      [
        "audit",
        "run",
        "openapi.json",
        "--output",
        "report.json",
        "--output-format",
        "json",
        "--verbose",
        "error",
        "--enrich=false",
        isSingleOperationAudit ? "--is-operation" : "",
        "--token",
        String(token),
      ].filter((option) => option !== ""),
      { cwd: dir as string, windowsHide: true }
    );

    const report = await readFile(join(dir as string, "report.json"), { encoding: "utf8" });
    const parsed = JSON.parse(report);

    unlinkSync(join(dir as string, "report.json"));
    unlinkSync(join(dir as string, "openapi.json"));
    rmdirSync(dir);

    const cliResponse = JSON.parse(output.stdout);
    return [{ audit: parsed, cli: cliResponse }, undefined];
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

function createTempDirectory(prefix: string) {
  const tmpDir = tmpdir();
  const dir = mkdtempSync(join(`${tmpDir}`, prefix));
  return dir;
}

export function exists(filename: string) {
  try {
    accessSync(filename, constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function getCrunchDirectory() {
  if (process.platform === "win32") {
    return join(process.env["APPDATA"] || homedir(), "42Crunch");
  } else {
    return join(homedir(), ".42crunch");
  }
}

function getBinDirectory() {
  return join(getCrunchDirectory(), "bin");
}

function getCliFilename() {
  if (process.platform === "win32") {
    return "42c-ast.exe";
  } else {
    return "42c-ast";
  }
}

function ensureDirectories() {
  mkdirSync(getBinDirectory(), { recursive: true });
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
  remainingFullAudit?: number;
  remainingPerOperationAudit?: number;
  remainingFullScan?: number;
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
