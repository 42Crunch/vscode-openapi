/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

export async function offerUpgrade(): Promise<unknown> {
  return vscode.window
    .showInformationMessage(
      "Thank you for using the 42Crunch API Security Testing services. You have reached the limit of your monthly Freemium service. You can now upgrade your 42Crunch subscription or continue as you are, but wait until the end of the time period for the service to restart.",
      { modal: true },
      { title: "Upgrade", id: "upgrade" }
    )
    .then((choice) => {
      if (choice?.id === "upgrade") {
        vscode.env.openExternal(vscode.Uri.parse("https://42crunch.com/ide-upgrade/"));
      }
    });
}

export const UPGRADE_WARN_LIMIT = 10;

export async function warnScans(left: number) {
  return vscode.window.showInformationMessage(
    `You have ${left} per-opertion Conformance Scans left. Consider upgrading your 42Crunch subscription.`
  );
}

export async function warnOperationAudits(left: number) {
  return vscode.window.showInformationMessage(
    `You have ${left} per-opertion Security Audits left. Consider upgrading your 42Crunch subscription.`
  );
}

export async function warnAudits(left: number) {
  return vscode.window.showInformationMessage(
    `You have ${left}  Security Audits left. Consider upgrading your 42Crunch subscription.`
  );
}
