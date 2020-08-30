/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import * as path from 'path';
import { parserOptions } from './parser-options';
import { bundle } from './bundler';

type Preview = {
  panel: vscode.WebviewPanel;
  documentUri: vscode.Uri;
  uris: { [key: string]: string };
};

type Previews = {
  redoc?: Preview;
  swaggerui?: Preview;
};

export function activate(context: vscode.ExtensionContext) {
  const previews: Previews = {};

  vscode.workspace.onDidChangeTextDocument(async (e) => {
    const uri = e.document.uri.toString();
    for (const name of Object.keys(previews)) {
      const preview: Preview = previews[name];
      if (preview && preview.uris[uri]) {
        const document = await vscode.workspace.openTextDocument(preview.documentUri);
        showPreview(context, previews, name, document);
      }
    }
  });

  vscode.commands.registerTextEditorCommand(
    'openapi.previewRedoc',
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
      await showPreview(context, previews, 'redoc', textEditor.document);
    },
  );

  vscode.commands.registerTextEditorCommand(
    'openapi.previewSwaggerUI',
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
      showPreview(context, previews, 'swaggerui', textEditor.document);
    },
  );
}

async function showPreview(
  context: vscode.ExtensionContext,
  previews: Previews,
  name: string,
  document: vscode.TextDocument,
) {
  if (previews[name]) {
    const panel = previews[name].panel;
    const [json, mapping, uris] = await bundle(document, parserOptions);
    panel.webview.postMessage({ command: 'preview', text: json });
    previews[name] = { panel, uris, documentUri: document.uri };
    return;
  }

  const panel = await buildWebviewPanel(context, name);

  panel.onDidDispose(
    () => {
      previews[name] = null;
    },
    undefined,
    context.subscriptions,
  );

  const [json, mapping, uris] = await bundle(document, parserOptions);
  panel.webview.postMessage({ command: 'preview', text: json });
  previews[name] = { panel, uris, documentUri: document.uri };
}

function buildWebviewPanel(context: vscode.ExtensionContext, name: string): Promise<vscode.WebviewPanel> {
  const panel = vscode.window.createWebviewPanel(`openapiPreview-${name}`, 'Preview', vscode.ViewColumn.Two, {
    enableScripts: true,
    retainContextWhenHidden: true,
  });

  return new Promise((resolve, reject) => {
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'init':
            resolve(panel);
        }
      },
      undefined,
      context.subscriptions,
    );

    const index = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'webview', 'generated', 'preview', name, 'index.js')),
    );
    panel.webview.html = getWebviewContent(panel.webview, index);
  });
}

function getWebviewContent(webview: vscode.Webview, index: vscode.Uri) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src ${webview.cspSource}; style-src 'unsafe-inline';">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
	<div id="root"></div>
	<script src="${index}"></script>
  </body>
  </html>`;
}
