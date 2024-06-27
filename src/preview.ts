/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as path from "path";
import { Configuration } from "./configuration";
import { Bundle } from "./types";
import { Cache } from "./cache";

type Preview = {
  panel: vscode.WebviewPanel;
  documentUri: vscode.Uri;
};

type PreviewType = keyof Previews;

type Previews = {
  redoc?: Preview;
  swaggerui?: Preview;
};

export function activate(
  context: vscode.ExtensionContext,
  cache: Cache,
  configuration: Configuration
) {
  const previews: Previews = {};

  let previewUpdateDelay: number;

  configuration.track<number>("previewUpdateDelay", (delay: number) => {
    previewUpdateDelay = delay;
  });

  function debounce(func: Function) {
    let timer: NodeJS.Timeout;
    return (...args: any) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(null, args);
      }, previewUpdateDelay);
    };
  }

  const debouncedPreview = debounce(showPreview);

  cache.onDidChange(async (document: vscode.TextDocument) => {
    const names: PreviewType[] = ["swaggerui", "redoc"];
    for (const name of names) {
      const preview: Preview = previews[name]!;
      const uri = document.uri.toString();
      if (preview && preview.documentUri.toString() === uri) {
        const bundle = await cache.getDocumentBundle(document);
        if (bundle && !("errors" in bundle)) {
          debouncedPreview(context, previews, name, document.uri, bundle);
        }
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
        configuration.get<string>("defaultPreviewRenderer") as PreviewType,
        textEditor.document
      )
  );
}

async function startPreview(
  context: vscode.ExtensionContext,
  cache: Cache,
  previews: Previews,
  renderer: PreviewType,
  document: vscode.TextDocument
) {
  try {
    const bundle = await cache.getDocumentBundle(document);
    if (!bundle || "errors" in bundle) {
      vscode.commands.executeCommand("workbench.action.problems.focus");
      vscode.window.showErrorMessage("Failed to generate preview, check OpenAPI file for errors.");
    } else {
      showPreview(context, previews, renderer, document.uri, bundle);
    }
  } catch (ex: any) {
    vscode.window.showErrorMessage(`Unexpected error trying to generate preview: ${ex}`);
  }
}

async function showPreview(
  context: vscode.ExtensionContext,
  previews: Previews,
  name: PreviewType,
  documentUri: vscode.Uri,
  bundle: Bundle
) {
  const preview = previews[name];
  if (preview) {
    const panel = preview.panel;
    panel.webview.postMessage({ command: "preview", text: JSON.stringify(bundle.value) });
    previews[name] = { panel, documentUri };
    return;
  }

  const title = name === "redoc" ? "OpenAPI ReDoc preview" : "OpenAPI SwaggerUI preview";

  const panel = await buildWebviewPanel(context, name, title);

  panel.onDidDispose(
    () => {
      previews[name] = undefined;
    },
    undefined,
    context.subscriptions
  );

  panel.webview.postMessage({ command: "preview", text: JSON.stringify(bundle.value) });
  previews[name] = { panel, documentUri };
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
        path.join(context.extensionPath, "webview", "generated", "preview", name, "main.js")
      )
    );
    const style = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "webview", "generated", "preview", name, "style.css")
      )
    );
    panel.webview.html = getWebviewContent(panel.webview, index, style);
  });
}

// Directive connect-src must be set to allow XHR
function getWebviewContent(webview: vscode.Webview, index: vscode.Uri, style: vscode.Uri) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; connect-src http: https:;">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <style>
	    body {
		  background-color: #FEFEFE;
	    }
	  </style>
    <link href="${style}" rel="stylesheet"/>
  </head>
  <body>
	<div id="root"></div>
	<script src="${index}"></script>
  </body>
  </html>`;
}
