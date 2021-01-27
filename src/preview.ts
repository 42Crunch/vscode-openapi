/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as path from "path";
import { configuration } from "./configuration";
import { Bundle, BundleResult } from "./types";
import { Cache } from "./cache";

type Preview = {
  panel: vscode.WebviewPanel;
  documentUri: vscode.Uri;
  uris: Set<string>;
};

type Previews = {
  redoc?: Preview;
  swaggerui?: Preview;
};

export function activate(context: vscode.ExtensionContext, cache: Cache) {
  const previews: Previews = {};

  cache.onDidChange(async (document: vscode.TextDocument) => {
    const uri = document.uri.toString();
    const bundle = await cache.getDocumentBundle(document);

    for (const name of Object.keys(previews)) {
      const preview: Preview = previews[name];
      if (preview && preview.uris.has(uri) && !("errors" in bundle)) {
        showPreview(context, previews, name, document.uri, bundle);
      }
    }
  });

  vscode.commands.registerTextEditorCommand(
    "openapi.previewRedoc",
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) =>
      startPreview(context, cache, previews, "redoc", textEditor.document)
  );

  vscode.commands.registerTextEditorCommand(
    "openapi.previewSwaggerUI",
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) =>
      startPreview(context, cache, previews, "swaggerui", textEditor.document)
  );

  vscode.commands.registerTextEditorCommand(
    "openapi.preview",
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) =>
      startPreview(
        context,
        cache,
        previews,
        configuration.get<string>("defaultPreviewRenderer"),
        textEditor.document
      )
  );
}

async function startPreview(
  context: vscode.ExtensionContext,
  cache: Cache,
  previews: Previews,
  renderer: string,
  document: vscode.TextDocument
) {
  const bundle = await cache.getDocumentBundle(document);
  if ("errors" in bundle) {
    vscode.commands.executeCommand("workbench.action.problems.focus");
    vscode.window.showErrorMessage("Failed to generate preview, check OpenAPI file for errors.");
  } else {
    showPreview(context, previews, renderer, document.uri, bundle);
  }
}

async function showPreview(
  context: vscode.ExtensionContext,
  previews: Previews,
  name: string,
  documentUri: vscode.Uri,
  bundle: Bundle
) {
  if (previews[name]) {
    const panel = previews[name].panel;
    panel.webview.postMessage({ command: "preview", text: JSON.stringify(bundle.value) });
    previews[name] = { panel, uris: bundle.uris, documentUri };
    return;
  }

  const title = name === "redoc" ? "OpenAPI ReDoc preview" : "OpenAPI SwaggerUI preview";

  const panel = await buildWebviewPanel(context, name, title);

  panel.onDidDispose(
    () => {
      previews[name] = null;
    },
    undefined,
    context.subscriptions
  );

  panel.webview.postMessage({ command: "preview", text: JSON.stringify(bundle.value) });
  previews[name] = { panel, uris: bundle.uris, documentUri };
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
