/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { CurlCommand } from "@xliic/common/messages/tryit";

export async function executeCurlRequest(payload: CurlCommand): Promise<void> {
  console.log("got curl command", payload);
  const terminal = vscode.window.createTerminal({});
  terminal.sendText(payload.curl);
  terminal.show();
}
