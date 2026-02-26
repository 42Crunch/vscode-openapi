/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, rmdirSync, unlinkSync } from "node:fs";
import { copyFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";

import { Config } from "@xliic/common/config";
import { getEndpoints } from "@xliic/common/endpoints";
import { SimpleEnvironment } from "@xliic/common/env";
import { Result } from "@xliic/result";

import { configuration } from "../configuration";
import { getAnondCredentials, getPlatformCredentials } from "../credentials";
import {
  CliError,
  CliResponse,
  debug,
  formatException,
  getBinDirectory,
  getCliFilename,
  getUserAgent,
  parseCliJsonResponse,
  readException,
} from "../platform/cli-ast";
import { Logger } from "../platform/types";
import { getProxyEnv } from "../proxy";
import { createTempDirectory, existsSync } from "../util/fs";

const asyncExecFile = promisify(execFile);

const execMaxBuffer = 1024 * 1024 * 20; // 20MB

export async function createGqlScanConfigWithCliBinary(
  scanconfUri: vscode.Uri,
  text: string,
  tags: string[],
  cliDirectoryOverride: string,
  logger: Logger,
): Promise<void> {
  const tmpdir = createTempDirectory("scan-");
  const gqlFilename = join(tmpdir, "openapi.graphql");
  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());

  const args = [
    "scan",
    "conf",
    "generate",
    "--graphql",
    "openapi.graphql",
    "--hosts",
    "http://localhost:8090",
    "--output",
    "scanconfig.json",
  ];

  // re-enable when tagging is supported
  if (tags.length > 0) {
    args.push("--tag", tags.join(","));
  }

  await writeFile(gqlFilename, text, { encoding: "utf8" });

  try {
    debug(cli, args, undefined, logger);

    await asyncExecFile(cli, args, { cwd: tmpdir, windowsHide: true, maxBuffer: execMaxBuffer });

    // create scan config directory if does not exist
    const scanconfDir = dirname(scanconfUri.fsPath);
    if (!existsSync(scanconfDir)) {
      mkdirSync(scanconfDir, { recursive: true });
    }

    // copy scanconfig to the destination
    const scanconfigFilename = join(tmpdir, "scanconfig.json");
    await copyFile(scanconfigFilename, scanconfUri.fsPath);

    // clean the temp directory
    unlinkSync(gqlFilename);
    unlinkSync(scanconfigFilename);
    rmdirSync(tmpdir);
  } catch (ex: any) {
    throw new Error(formatException(ex));
  }
}

export async function runGqlScanWithCliBinary(
  secrets: vscode.SecretStorage,
  scanEnv: SimpleEnvironment,
  config: Config,
  tags: string[],
  logger: Logger,
  graphQl: string,
  scanconf: string,
  isFullScan: boolean,
): Promise<
  Result<{ reportFilename: string; cli: CliResponse; tempScanDirectory: string }, CliError>
> {
  logger.info(`Running GraphQL API Conformance Scan using 42Crunch API Security Testing Binary`);

  const { cliFreemiumdHost, freemiumdUrl } = getEndpoints(config.internalUseDevEndpoints);
  const tmpDir = tmpdir();
  const dir = mkdtempSync(join(`${tmpDir}`, "scan-"));
  const gqlFilename = join(dir as string, "input.graphql");
  const scanconfFilename = join(dir as string, "scanconf.json");
  const reportFilename = join(dir as string, "report.json");

  await writeFile(gqlFilename, graphQl, { encoding: "utf8" });
  await writeFile(scanconfFilename, scanconf, { encoding: "utf8" });

  logger.info(`Wrote scan configuration to: ${dir}`);

  const cli = join(getBinDirectory(config.cliDirectoryOverride), getCliFilename());

  logger.info(`Running scan using: ${cli}`);

  const userAgent = getUserAgent();

  const args = [
    "scan",
    "run",
    "--graphql",
    "input.graphql",
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
  if (tags.length > 0) {
    args.push("--tag", tags.join(","));
  }

  if (config.platformAuthType === "anond-token") {
    const anondToken = getAnondCredentials(configuration);
    args.push("--token", String(anondToken));
    Object.assign(
      scanEnv,
      await getProxyEnv(freemiumdUrl, scanEnv["SCAN42C_HOST"], config, logger),
    );
  } else {
    const platformConnection = await getPlatformCredentials(configuration, secrets);
    if (platformConnection !== undefined) {
      scanEnv["API_KEY"] = platformConnection.apiToken!;
      scanEnv["PLATFORM_HOST"] = platformConnection.platformUrl;
      Object.assign(
        scanEnv,
        await getProxyEnv(platformConnection.platformUrl, scanEnv["SCAN42C_HOST"], config, logger),
      );
    }
  }

  try {
    debug(cli, args, scanEnv, logger);
    const output = await asyncExecFile(cli, args, {
      cwd: dir as string,
      windowsHide: true,
      env: scanEnv,
      maxBuffer: execMaxBuffer,
    });

    const cliResponse = parseCliJsonResponse(output.stdout);

    return [{ reportFilename, cli: cliResponse!, tempScanDirectory: dir }, undefined];
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
