/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as path from "path";
import { parserOptions } from "./parser-options";
import { bundle, displayBundlerErrors } from "./bundler";
import { configuration } from "./configuration";
import { RuntimeContext } from "./types";

type Preview = {
  panel: vscode.WebviewPanel;
  documentUri: vscode.Uri;
  uris: { [key: string]: string };
  timeout: NodeJS.Timer;
};

type Previews = {
  redoc?: Preview;
  swaggerui?: Preview;
};

const ON_CHANGE_TIMEOUT = 1000; // 1 sec timeout for onDidChange

export function activate(context: vscode.ExtensionContext, runtimeContext: RuntimeContext) {
  const previews: Previews = {};

  vscode.workspace.onDidChangeTextDocument(async (e) => {
    const uri = e.document.uri.toString();
    for (const name of Object.keys(previews)) {
      const preview: Preview = previews[name];
      if (preview && preview.uris[uri]) {
        if (preview.timeout) {
          clearTimeout(preview.timeout);
        }
        setTimeout(async () => {
          const document = await vscode.workspace.openTextDocument(preview.documentUri);
          try {
            runtimeContext.bundlingDiagnostics.clear();
            const [json, mapping, uris] = await bundle(document, parserOptions);
            showPreview(context, runtimeContext, previews, name, document, json, uris);
          } catch (err) {
            displayBundlerErrors(
              document.uri,
              parserOptions,
              runtimeContext.bundlingDiagnostics,
              err
            );
          }
        }, ON_CHANGE_TIMEOUT);
      }
    }
  });

  vscode.commands.registerTextEditorCommand(
    "openapi.previewRedoc",
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) =>
      startPreview(context, runtimeContext, previews, "redoc", textEditor.document)
  );

  vscode.commands.registerTextEditorCommand(
    "openapi.previewSwaggerUI",
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) =>
      startPreview(context, runtimeContext, previews, "swaggerui", textEditor.document)
  );

  vscode.commands.registerTextEditorCommand(
    "openapi.preview",
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) =>
      startPreview(
        context,
        runtimeContext,
        previews,
        configuration.get<string>("defaultPreviewRenderer"),
        textEditor.document
      )
  );
}

async function startPreview(
  context: vscode.ExtensionContext,
  runtimeContext: RuntimeContext,
  previews: Previews,
  renderer: string,
  document: vscode.TextDocument
) {
  try {
    runtimeContext.bundlingDiagnostics.clear();
    const [json, mapping, uris] = await bundle(document, parserOptions);
    showPreview(context, runtimeContext, previews, renderer, document, json, uris);
  } catch (e) {
    displayBundlerErrors(document.uri, parserOptions, runtimeContext.bundlingDiagnostics, e);
    vscode.commands.executeCommand("workbench.action.problems.focus");
    vscode.window.showErrorMessage("Failed to generate preview, check OpenAPI file for errors.");
  }
}

async function showPreview(
  context: vscode.ExtensionContext,
  runtimeContext: RuntimeContext,
  previews: Previews,
  name: string,
  document: vscode.TextDocument,
  json: string,
  uris: any
) {
  if (previews[name]) {
    const panel = previews[name].panel;
    panel.webview.postMessage({ command: "preview", text: json });
    previews[name] = { panel, uris, documentUri: document.uri };
    return;
  }

  const title = name === "redoc" ? "OpenAPI ReDoc preview" : "OpenAPI SwaggerUI preview";

  const panel = await buildWebviewPanel(context, name, title);

  panel.onDidDispose(
    () => {
      runtimeContext.bundlingDiagnostics.clear();
      clearTimeout(previews[name].timeout);
      previews[name] = null;
    },
    undefined,
    context.subscriptions
  );

  panel.webview.postMessage({ command: "preview", text: json });
  previews[name] = { panel, uris, documentUri: document.uri };
}

function buildWebviewPanel(
  context: vscode.ExtensionContext,
  name: string,
  title: string
): Promise<vscode.WebviewPanel> {
  const panel = vscode.window.createWebviewPanel(
    `openapiPreview-${name}`,
    title,
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  return new Promise((resolve, reject) => {
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "init":
            resolve(panel);
        }
      },
      undefined,
      context.subscriptions
    );

    const index = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "webview", "generated", "preview", name, "index.js")
      )
    );
    panel.webview.html = getWebviewContent(panel.webview, index);
  });
}

// Directive connect-src must be set to allow XHR
function getWebviewContent(webview: vscode.Webview, index: vscode.Uri) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src ${webview.cspSource}; style-src 'unsafe-inline'; connect-src http: https:;">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <style>
	    body {
		  background-color: #FEFEFE;
	    }
	  </style>
  </head>
  <body>
	<div id="root"></div>
	<script src="${index}"></script>
  </body>
  </html>`;
}
