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
import {
  UPGRADE_WARN_LIMIT,
  offerUpgrade,
  warnAudits,
  warnOperationAudits,
} from "../../platform/upgrade";

export async function runCliAudit(
  document: vscode.TextDocument,
  oas: string,
  mapping: MappingNode,
  cache: Cache,
  secrets: vscode.SecretStorage,
  progress: vscode.Progress<any>,
  isSingleOperationAudit: boolean
): Promise<Audit | undefined> {
  const logger: Logger = {
    fatal: (message: string) => null,
    error: (message: string) => null,
    warning: (message: string) => null,
    info: (message: string) => null,
    debug: (message: string) => null,
  };

  const [result, error] = await runAuditWithCliBinary(secrets, logger, oas, isSingleOperationAudit);

  if (error !== undefined) {
    if (error.statusCode === 3 && error.statusMessage === "limits_reached") {
      await offerUpgrade();
      return;
    } else {
      throw new Error(`Unexpected error running Security Audit: ${JSON.stringify(error)}`);
    }
  }

  if (isSingleOperationAudit && result.cli.remainingPerOperationAudit < UPGRADE_WARN_LIMIT) {
    warnOperationAudits(result.cli.remainingPerOperationAudit);
  } else if (!isSingleOperationAudit && result.cli.remainingFullAudit < UPGRADE_WARN_LIMIT) {
    warnAudits(result.cli.remainingFullAudit);
  }

  return await parseAuditReport(cache, document, result.audit, mapping);
}
