/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import got from "got";
import { configuration } from "./configuration";

export const INTERNAL_SCHEMES = {
  http: "openapi-internal-http",
  https: "openapi-internal-https",
};

const CONTENT_TYPES = {
  "application/json": "json",
  "application/x-yaml": "yaml",
  "text/yaml": "yaml",
};

const EXTENSIONS = {
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
};

export function requiresApproval(internalUri: vscode.Uri): boolean {
  return Object.values(INTERNAL_SCHEMES).includes(internalUri.scheme?.toLowerCase());
}

export function toInternalUri(uri: vscode.Uri): vscode.Uri {
  const scheme = INTERNAL_SCHEMES[uri.scheme];
  if (scheme) {
    return uri.with({ scheme });
  }
  return uri;
}

export function fromInternalUri(uri: vscode.Uri): vscode.Uri {
  for (const [external, internal] of Object.entries(INTERNAL_SCHEMES)) {
    if (uri.scheme === internal) {
      return uri.with({ scheme: external });
    }
  }
  return uri;
}

function getLanguageId(uri: string, contentType: string): string | undefined {
  const fromContentType = contentType && CONTENT_TYPES[contentType.toLowerCase()];
  if (fromContentType) {
    return fromContentType;
  }

  for (const [extension, language] of Object.entries(EXTENSIONS)) {
    if (uri.toLowerCase().endsWith(extension)) {
      return language;
    }
  }

  return undefined;
}

export class ExternalRefDocumentProvider implements vscode.TextDocumentContentProvider {
  private cache: { [uri: string]: string } = {};

  getLanguageId(uri: vscode.Uri): string | undefined {
    const actualUri = fromInternalUri(uri);
    return this.cache[actualUri.toString()];
  }

  async provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken
  ): Promise<string> {
    const approvedHosts = configuration.get<string[]>("approvedHostnames");

    const approved = approvedHosts.some(
      (approvedHostname) => approvedHostname.toLowerCase() === uri.authority.toLowerCase()
    );

    if (!approved) {
      throw new Error(`Hostname ${uri.authority}" is not in the list of approved hosts`);
    }

    const actualUri = fromInternalUri(uri);
    const { body, headers } = await got(actualUri.toString());

    const languageId = getLanguageId(actualUri.toString(), headers["content-type"]);
    this.cache[actualUri.toString()] = languageId;

    try {
      if (languageId === "json") {
        return JSON.stringify(JSON.parse(body), null, 2);
      }
    } catch (ex) {
      // ignore
    }

    return body;
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

export function registerAddApprovedHost(context: vscode.ExtensionContext) {
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
