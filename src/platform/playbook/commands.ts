/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
// import { PlatformContext } from "../types";
// import { Cache } from "../../cache";
// import { PlatformStore } from "../stores/platform-store";
// import { HttpMethod } from "@xliic/common/http";

export default () =>
  // cache: Cache,
  // platformContext: PlatformContext,
  // store: PlatformStore,
  // view: ScanWebView
  {
    vscode.commands.registerTextEditorCommand(
      "playbook.showAuthDetails",
      async (): // editor: vscode.TextEditor,
      // edit: vscode.TextEditorEdit,
      // uri: string,
      // path: string,
      // method: HttpMethod
      Promise<void> => {
        try {
          await showAuthDetails(); // showAuthDetails(editor, edit, cache, store, view, uri, path, method);
        } catch (ex: any) {
          // if (
          //   ex?.response?.statusCode === 409 &&
          //   ex?.response?.body?.code === 109 &&
          //   ex?.response?.body?.message === "limit reached"
          // ) {
          //   vscode.window.showErrorMessage(
          //     "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
          //   );
          // } else {
          //   vscode.window.showErrorMessage("Failed to scan: " + ex.message);
          // }
        }
      }
    );
  };

async function showAuthDetails(): Promise<void> {
  // async function showAuthDetails(
  //   editor: vscode.TextEditor,
  //   edit: vscode.TextEditorEdit,
  //   cache: Cache,
  //   store: PlatformStore,
  //   view: ScanWebView,
  //   uri: string,
  //   path: string,
  //   method: HttpMethod
  console.info("playbook showAuthDetails called");
}
