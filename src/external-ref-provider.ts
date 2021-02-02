/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import got from "got";
import { configuration } from "./configuration";

const SCHEMES = {
  "openapi-external-http": "http",
  "openapi-external-https": "https",
};

export class ExternalRefDocumentProvider implements vscode.TextDocumentContentProvider {
  async provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken
  ): Promise<string> {
    const actualUri = uri.with({ scheme: SCHEMES[uri.scheme] });
    const response = await got(actualUri.toString());
    return response.body;
  }
}

export class ApproveHostnameAction implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const result: vscode.CodeAction[] = [];
    for (const diagnostic of context.diagnostics) {
      if (diagnostic.code === "rejected" && "rejectedHost" in diagnostic) {
        const hostname = diagnostic["rejectedHost"];
        const title = `Add "${hostname}" to the list of approved hostnames`;
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.command = {
          arguments: [diagnostic["rejectedHost"]],
          command: "openapi.addApprovedHost",
          title,
        };
        action.diagnostics = [diagnostic];
        action.isPreferred = true;
        result.push(action);
      }
    }
    return result;
  }
}

export function registerAddApprovedHost(context) {
  return vscode.commands.registerCommand("openapi.addApprovedHost", (hostname: string) => {
    const approved = configuration.get<string[]>("approvedHostnames");
    if (!approved.includes(hostname.toLocaleLowerCase()))
      configuration.update(
        "approvedHostnames",
        [...approved, hostname.toLocaleLowerCase()],
        vscode.ConfigurationTarget.Global
      );
  });
}
