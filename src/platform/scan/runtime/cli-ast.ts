/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Config } from "@xliic/common/config";
import { SimpleEnvironment } from "@xliic/common/env";
import { readFileSync, writeFileSync } from "fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname } from "node:path";
import { join } from "path";
import * as vscode from "vscode";
import { EnvStore } from "../../../envstore";
import { Logger } from "../../types";

export async function createScanConfigWithCliBinary(
  apiUri: vscode.Uri,
  scanconfUri: vscode.Uri
): Promise<void> {
  const cwd = dirname(apiUri.fsPath);
  const cli = join(homedir(), ".42crunch", "bin", "42c-ast");

  execFileSync(
    cli,
    [
      "scan",
      "conf",
      "generate",
      "--output-format",
      "json",
      "--output",
      scanconfUri.fsPath,
      apiUri.fsPath,
    ],
    { cwd, windowsHide: true }
  );
}

export async function runScanWithCliBinary(
  envStore: EnvStore,
  scanEnv: SimpleEnvironment,
  config: Config,
  logger: Logger,
  oas: string,
  scanconf: string
) {
  logger.info(`Running conformance scan using 42c-ast binary`);

  const tmpDir = tmpdir();
  const dir = mkdtempSync(join(`${tmpDir}`, "scan-"));

  writeFileSync(join(dir as string, "openapi.json"), oas, { encoding: "utf8" });
  writeFileSync(join(dir as string, "scanconf.json"), scanconf, { encoding: "utf8" });

  logger.info(`Wrote scan configuration to: ${dir}`);

  const cli = join(homedir(), ".42crunch", "bin", "42c-ast");

  logger.info(`Running scan using: ${cli}`);

  execFileSync(
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
      "debug",
    ],
    { cwd: dir as string, windowsHide: true, env: scanEnv }
  );

  const report = readFileSync(join(dir as string, "report.json"), { encoding: "utf8" });
  const parsed = JSON.parse(report);
  return parsed;
}
