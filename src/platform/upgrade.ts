/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { delay } from "../time-util";

export async function offerUpgrade(): Promise<unknown> {
  await delay(100); // workaround for #133073

  const message =
    "You have insufficient usage allowance left to complete your request. As an alternative, upgrade to increase your allowances or wait until your monthly usage allowance renews.";
  return vscode.window
    .showInformationMessage(message, { modal: true }, { title: "View subscription", id: "upgrade" })
    .then((choice) => {
      if (choice?.id === "upgrade") {
        vscode.commands.executeCommand("openapi.showConfiguration");
      }
    });
}

export const UPGRADE_WARN_LIMIT = 10;

export async function warnOperationScans(left: number) {
  return vscode.window
    .showInformationMessage(
      `You have ${left} per-operation API Scans left this month. Your usage allowance resets every month. Upgrade to increase allowances.`,
      { modal: false },
      { title: "View subscription", id: "upgrade" }
    )
    .then((choice) => {
      if (choice?.id === "upgrade") {
        vscode.commands.executeCommand("openapi.showConfiguration");
      }
    });
}

export async function warnOperationAudits(left: number) {
  return vscode.window
    .showInformationMessage(
      `You have ${left} per-operation Security Audits left this month. Your usage allowance resets every month. Upgrade to increase allowances.`,
      { modal: false },
      { title: "View subscription", id: "upgrade" }
    )
    .then((choice) => {
      if (choice?.id === "upgrade") {
        vscode.commands.executeCommand("openapi.showConfiguration");
      }
    });
}
