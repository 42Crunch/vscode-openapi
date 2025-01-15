/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";

import { Audit } from "@xliic/common/audit";

import { Cache } from "../../cache";
import { getTagDataEntry, PlatformStore } from "../../platform/stores/platform-store";
import { MappingNode } from "../../types";
import { parseAuditReport } from "../audit";
import { formatException } from "../../platform/util";
import { createTempDirectory } from "../../util/fs";
import { writeFile } from "node:fs/promises";
import { saveAuditReportToTempDirectory } from "../util";

export async function runPlatformAudit(
  document: vscode.TextDocument,
  oas: string,
  mapping: MappingNode,
  cache: Cache,
  store: PlatformStore,
  memento?: vscode.Memento
): Promise<{ audit: Audit; tempAuditDirectory: string } | undefined> {
  try {
    const tmpApi = await store.createTempApi(oas, getTagDataEntry(memento, document.uri.fsPath));
    const report = await store.getAuditReport(tmpApi.apiId);
    const compliance = await store.readAuditCompliance(report.tid);
    const todoReport = await store.readAuditReportSqgTodo(report.tid);
    await store.clearTempApi(tmpApi);
    const audit = await parseAuditReport(cache, document, report.data, mapping);
    const { issues: todo } = await parseAuditReport(cache, document, todoReport.data, mapping);
    audit.compliance = compliance;
    audit.todo = todo;
    const tempAuditDirectory = await saveAuditReportToTempDirectory(report.data);
    return { audit, tempAuditDirectory };
  } catch (ex: any) {
    if (
      ex?.response?.statusCode === 409 &&
      ex?.response?.body?.code === 109 &&
      ex?.response?.body?.message === "limit reached"
    ) {
      vscode.window.showErrorMessage(
        "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
      );
    } else {
      vscode.window.showErrorMessage(
        formatException("Unexpected error when trying to audit API using the platform:", ex)
      );
    }
  }
}
