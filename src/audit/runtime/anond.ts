/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Audit } from "@xliic/common/audit";
import { Configuration } from "../../configuration";
import { audit } from "../client";

import { Cache } from "../../cache";
import { MappingNode } from "../../types";
import { parseAuditReport } from "../audit";

export async function runAnondAudit(
  document: vscode.TextDocument,
  oas: string,
  mapping: MappingNode,
  cache: Cache,
  configuration: Configuration,
  progress: vscode.Progress<any>
): Promise<Audit | undefined> {
  const apiToken = <string>configuration.get("securityAuditToken");
  try {
    const report = await audit(oas, apiToken.trim(), progress);
    return parseAuditReport(cache, document, report, mapping);
  } catch (e: any) {
    if (e?.response?.statusCode === 429) {
      vscode.window.showErrorMessage(
        "Too many requests. You can run up to 3 security audits per minute, please try again later."
      );
    } else if (e?.response?.statusCode === 403) {
      if (e?.response?.body?.includes("request validation")) {
        vscode.window.showErrorMessage(
          "Failed to submit OpenAPI for security audit. Please check if your file is less than 2Mb in size"
        );
      } else {
        vscode.window.showErrorMessage(
          "Authentication failed. Please paste the token that you received in email to Preferences > Settings > Extensions > OpenAPI > Security Audit Token. If you want to receive a new token instead, clear that setting altogether and initiate a new security audit for one of your OpenAPI files."
        );
      }
    } else {
      vscode.window.showErrorMessage("Unexpected error when trying to audit API: " + e);
    }
  }
}
