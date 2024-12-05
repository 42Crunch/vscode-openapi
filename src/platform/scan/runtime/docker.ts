/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Config } from "@xliic/common/config";
import { SimpleEnvironment } from "@xliic/common/env";
import * as vscode from "vscode";
import { EnvStore } from "../../../envstore";
import { Logger } from "../../types";
import { delay } from "../../../time-util";

export async function runScanWithDocker(
  envStore: EnvStore,
  scanEnv: SimpleEnvironment,
  config: Config,
  logger: Logger,
  token: string
) {
  logger.info(`Running API Conformance Scan using docker`);

  const terminal = findOrCreateTerminal();

  const env = { ...scanEnv };

  const services =
    config.platformServices.source === "auto"
      ? config.platformServices.auto
      : config.platformServices.manual;

  env["SCAN_TOKEN"] = token.trim();
  env["PLATFORM_SERVICE"] = services!;

  const envString = Object.entries(env)
    .map(([key, value]) => `-e ${key}='${value}'`)
    .join(" ");

  const hostNetwork =
    config.docker.useHostNetwork && (config.platform == "linux" || config.platform == "freebsd")
      ? "--network host"
      : "";

  terminal.sendText("");
  terminal.show();
  await delay(2000);
  terminal.sendText(`docker run ${hostNetwork} --rm ${envString} ${config.scanImage}`);

  return undefined;
}

function findOrCreateTerminal() {
  const name = "scan";
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === name && terminal.exitStatus === undefined) {
      return terminal;
    }
  }
  return vscode.window.createTerminal({ name });
}
