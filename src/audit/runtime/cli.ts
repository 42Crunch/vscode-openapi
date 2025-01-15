/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Audit } from "@xliic/common/audit";
import { Logger } from "../../platform/types";

import { Cache } from "../../cache";
import { MappingNode } from "../../types";
import { parseAuditReport } from "../audit";
import { runAuditWithCliBinary } from "../../platform/cli-ast";
import { UPGRADE_WARN_LIMIT, offerUpgrade, warnOperationAudits } from "../../platform/upgrade";
import { Configuration } from "../../configuration";
import { loadConfig } from "../../util/config";

export async function runCliAudit(
  document: vscode.TextDocument,
  oas: string,
  mapping: MappingNode,
  tags: string[],
  cache: Cache,
  secrets: vscode.SecretStorage,
  configuration: Configuration,
  progress: vscode.Progress<any>,
  isFullAudit: boolean
): Promise<{ audit: Audit; tempAuditDirectory: string } | undefined> {
  const logger: Logger = {
    fatal: (message: string) => null,
    error: (message: string) => null,
    warning: (message: string) => null,
    info: (message: string) => null,
    debug: (message: string) => null,
  };

  const config = await loadConfig(configuration, secrets);

  const [result, error] = await runAuditWithCliBinary(
    secrets,
    config,
    logger,
    oas,
    tags,
    isFullAudit,
    config.cliDirectoryOverride
  );

  if (error !== undefined) {
    if (error.statusCode === 3 && error.statusMessage === "limits_reached") {
      await offerUpgrade(isFullAudit);
      return;
    } else {
      throw new Error(`Unexpected error running Security Audit: ${JSON.stringify(error)}`);
    }
  }

  if (
    result.cli.remainingPerOperationAudit !== undefined &&
    result.cli.remainingPerOperationAudit < UPGRADE_WARN_LIMIT
  ) {
    warnOperationAudits(result.cli.remainingPerOperationAudit);
  }

  const audit = await parseAuditReport(cache, document, result.audit, mapping);

  if (result.todo !== undefined) {
    const { issues: todo } = await parseAuditReport(cache, document, result.todo, mapping);
    audit.todo = todo;
  }

  if (result.compliance !== undefined) {
    audit.compliance = result.compliance as any;
  }

  return { audit, tempAuditDirectory: result.tempAuditDirectory };
}
