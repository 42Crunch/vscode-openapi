/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Cache } from "./cache";
import { OutlineProvider } from "./outlines/provider";

export function registerOutlines(
  context: vscode.ExtensionContext,
  cache: Cache
): vscode.Disposable[] {
  const provider = new OutlineProvider(context, cache);
  vscode.window.createTreeView("openapiOutline", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  vscode.commands.registerCommand("openapi.searchOutline", async (...args: any[]) => {
    search(provider);
  });
  vscode.commands.registerCommand("openapi.outline.resetSearch", async (...args: any[]) => {
    filterReset(provider);
  });
  return [];
}

async function search(provider: OutlineProvider) {
  const name = await vscode.window.showInputBox({
    prompt: "Search OpenAPI outline",
  });
  if (name !== undefined) {
    if (name !== "") {
      provider.runSearch(name);
    } else {
      provider.runSearch();
    }
    provider.refresh();
  }
}

async function filterReset(provider: OutlineProvider) {
  provider.runSearch();
  provider.refresh();
}
