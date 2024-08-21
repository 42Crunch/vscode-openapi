/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { delay } from "../time-util";

export async function offerUpgrade(): Promise<unknown> {
  await delay(100); // workaround for #133073
  return vscode.window
    .showInformationMessage(
      "Thank you for using the 42Crunch API Security Testing services. You have reached the limit of your monthly Freemium allowance. You have the option to wait until your free monthly allowance resets or upgrade your 42Crunch subscription.",
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
  return vscode.window
    .showInformationMessage(
      `You have ${left} API Scans left this month. Your usage allowance resets every month. Upgrade to increase allowances.`,
      { modal: false },
      { title: "Upgrade", id: "upgrade" }
    )
    .then((choice) => {
      if (choice?.id === "upgrade") {
        vscode.env.openExternal(vscode.Uri.parse("https://42crunch.com/ide-upgrade/"));
      }
    });
}

export async function warnOperationScans(left: number) {
  return vscode.window
    .showInformationMessage(
      `You have ${left} per-opertion API Scans left this month. Your usage allowance resets every month. Upgrade to increase allowances.`,
      { modal: false },
      { title: "Upgrade", id: "upgrade" }
    )
    .then((choice) => {
      if (choice?.id === "upgrade") {
        vscode.env.openExternal(vscode.Uri.parse("https://42crunch.com/ide-upgrade/"));
      }
    });
}

export async function warnOperationAudits(left: number) {
  return vscode.window
    .showInformationMessage(
      `You have ${left} per-opertion Security Audits left this month. Your usage allowance resets every month. Upgrade to increase allowances.`,
      { modal: false },
      { title: "Upgrade", id: "upgrade" }
    )
    .then((choice) => {
      if (choice?.id === "upgrade") {
        vscode.env.openExternal(vscode.Uri.parse("https://42crunch.com/ide-upgrade/"));
      }
    });
}

export async function warnAudits(left: number) {
  return vscode.window
    .showInformationMessage(
      `You have ${left} Security Audits left this month. Your usage allowance resets every month. Upgrade to increase allowances.`,
      { modal: false },
      { title: "Upgrade", id: "upgrade" }
    )
    .then((choice) => {
      if (choice?.id === "upgrade") {
        vscode.env.openExternal(vscode.Uri.parse("https://42crunch.com/ide-upgrade/"));
      }
    });
}
