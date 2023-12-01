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
import * as vscode from "vscode";

import { CliDownloadProgress, CliTestResult, Config } from "@xliic/common/config";
import { SimpleEnvironment } from "@xliic/common/env";
import { Result } from "@xliic/common/result";

import { Configuration, configuration } from "../configuration";
import { getAnondCredentials, getPlatformCredentials, hasCredentials } from "../credentials";
import { EnvStore } from "../envstore";
import { Logger } from "./types";
import { loadConfig } from "../util/config";
import { delay } from "../time-util";

const asyncExecFile = promisify(execFile);

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
      return { success: true, version };
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

  if (info.found) {
    return true;
  }

  await delay(100); // workaround for #133073
  const answer = await vscode.window.showInformationMessage(
    "42Crunch CLI is not found, download?",
    { modal: true },
    { title: "Download", id: "download" }
  );

  if (answer?.id === "download") {
    const downloaded = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Downloading 42Crunch CLI",
        cancellable: false,
      },
      async (progress, cancellationToken): Promise<boolean> => {
        let previous = 0;
        for await (const downloadProgress of downloadCli(config.repository)) {
          const increment = (downloadProgress.percent - previous) * 100;
          previous = downloadProgress.percent;
          progress.report({ increment });
        }
        return true;
      }
    );
    return downloaded;
  }
  return false;
}

export async function* downloadCli(
  repository: string
): AsyncGenerator<CliDownloadProgress, string, unknown> {
  if (repository === undefined || repository === "") {
    throw new Error("Repository URL is not set");
  }
  ensureDirectories();
  const tmpCli = yield* downloadToTempFile(repository);
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
  envStore: EnvStore,
  scanEnv: SimpleEnvironment,
  config: Config,
  logger: Logger,
  oas: string,
  scanconf: string
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

  const token =
    (await hasCredentials(configuration, secrets)) === "anond"
      ? getAnondCredentials(configuration)
      : (await getPlatformCredentials(configuration, secrets))?.apiToken;

  try {
    const output = await asyncExecFile(
      cli,
      [
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
        "--is-operation",
        "--token",
        String(token),
      ],
      { cwd: dir as string, windowsHide: true, env: scanEnv }
    );

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

  const token =
    (await hasCredentials(configuration, secrets)) === "anond"
      ? getAnondCredentials(configuration)
      : (await getPlatformCredentials(configuration, secrets))?.apiToken;

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

function getRepoCliFilename() {
  if (process.platform === "win32") {
    return "42c-ast-windows-amd64.exe";
  } else if (process.platform === "darwin" && process.arch == "arm64") {
    return "42c-ast-darwin-arm64";
  } else if (process.platform === "darwin" && process.arch == "x64") {
    return "42c-ast-darwin-amd64";
  } else if (process.platform === "linux" && process.arch == "x64") {
    return "42c-ast-linux-amd64";
  }
}

function getRepoUrl(repository: string) {
  if (repository.endsWith("/")) {
    return repository;
  } else {
    return `${repository}/`;
  }
}

function ensureDirectories() {
  mkdirSync(getBinDirectory(), { recursive: true });
}

async function* downloadToTempFile(
  repository: string
): AsyncGenerator<CliDownloadProgress, string, unknown> {
  const asyncFinished = promisify(finished);
  const cliFilename = getCliFilename();
  const tmpdir = createTempDirectory("42c-ast-download-");
  const tmpfile = join(tmpdir, cliFilename);
  const fileWriterStream = createWriteStream(tmpfile);
  const downloadUrl = getRepoUrl(repository) + getRepoCliFilename();
  const downloadStream = got.stream(downloadUrl);

  for await (const chunk of downloadStream) {
    yield downloadStream.downloadProgress;

    if (!fileWriterStream.write(chunk)) {
      await once(fileWriterStream, "drain");
    }
  }
  fileWriterStream.end();
  await asyncFinished(fileWriterStream);

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
  remainingFullAudit: number;
  remainingPerOperationAudit: number;
  remainingFullScan: number;
  remainingPerOperationScan: number;
  scanLogs?: CliLogEntry[];
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
