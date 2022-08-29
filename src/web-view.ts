/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from "path";
import * as vscode from "vscode";
import { Message } from "@xliic/common/message";
import {
  VsCodeColorMap,
  ThemeColorName,
  ThemeColorNames,
  ThemeColorVariables,
} from "@xliic/common/theme";

export abstract class WebView<Request extends Message, Response extends Message> {
  private style: vscode.Uri;
  private script: vscode.Uri;
  private panel?: vscode.WebviewPanel;
  abstract responseHandlers: Record<
    Response["command"],
    (response: any) => Promise<Request | void>
  >;

  constructor(
    extensionPath: string,
    private viewId: string,
    private viewTitle: string,
    private column: vscode.ViewColumn
  ) {
    this.script = vscode.Uri.file(
      path.join(extensionPath, "webview", "generated", viewId, "index.js")
    );
    this.style = vscode.Uri.file(
      path.join(extensionPath, "webview", "generated", viewId, "style.css")
    );
  }

  isActive(): boolean {
    return this.panel !== undefined;
  }

  protected async sendRequest(request: Request): Promise<void> {
    if (this.panel) {
      await this.panel!.webview.postMessage(request);
    } else {
      throw new Error(`Can't send message to ${this.viewId}, webview not initialized`);
    }
  }

  async handleResponse(response: Response): Promise<void> {
    const handler = this.responseHandlers[response.command as Response["command"]];

    if (handler) {
      const request = await handler(response.payload);
      if (request !== undefined) {
        this.sendRequest(request);
      }
    } else {
      throw new Error(
        `Unable to find response handler for command: ${response.command} in ${this.viewId} webview`
      );
    }
  }

  async show(): Promise<void> {
    if (!this.panel) {
      const panel = await this.createPanel();
      panel.onDidDispose(() => (this.panel = undefined));
      panel.webview.onDidReceiveMessage(async (message) => {
        this.handleResponse(message as Response);
      });
      this.panel = panel;
    } else if (!this.panel.visible) {
      this.panel.reveal();
    }
  }

  createPanel(): Promise<vscode.WebviewPanel> {
    const panel = vscode.window.createWebviewPanel(
      this.viewId,
      this.viewTitle,
      {
        viewColumn: this.column,
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    if (process.env["XLIIC_WEB_VIEW_DEV_MODE"] === "true") {
      panel.webview.html = this.getDevHtml(
        panel.webview.cspSource,
        panel.webview.asWebviewUri(this.script),
        panel.webview.asWebviewUri(this.style)
      );
    } else {
      panel.webview.html = this.getHtml(
        panel.webview.cspSource,
        panel.webview.asWebviewUri(this.script),
        panel.webview.asWebviewUri(this.style)
      );
    }

    return new Promise((resolve, reject) => {
      panel.webview.onDidReceiveMessage((message: any) => {
        if (message.command === "started") {
          resolve(panel);
        }
      });
    });
  }

  private getDevHtml(cspSource: string, script: vscode.Uri, style: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"  content="default-src 'none';  img-src ${cspSource} https: data:; script-src ${cspSource} http://localhost:3000/ 'unsafe-inline'; style-src ${cspSource} http://localhost:3000/ 'unsafe-inline'; connect-src http: https: ws:">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <base href="http://localhost:3000/">
      <script type="module" src="/@vite/client"></script>
      <script type="module">
      import RefreshRuntime from "/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
      </script>
      <style>
        ${customCssProperties()}
      </style>
    </head>
    <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=${Date.now()}"></script>
    <script>
      window.addEventListener("DOMContentLoaded", (event) => {
        const vscode = acquireVsCodeApi();
        window.renderWebView(vscode);
        vscode.postMessage({command: "started"});
      });
    </script>
    </body>
    </html>`;
  }

  private getHtml(cspSource: string, script: vscode.Uri, style: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"  content="default-src 'none';  img-src ${cspSource} https: data:; script-src ${cspSource} 'unsafe-inline'; style-src ${cspSource}  'unsafe-inline'; connect-src http: https:">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${style}" rel="stylesheet">
      <style type="text/css">
        ${customCssProperties()}
      </style>
    </head>
    <body>
    <div id="root"></div>  
    <script src="${script}"></script>
    <script>
      window.addEventListener("DOMContentLoaded", (event) => {
        const vscode = acquireVsCodeApi();
        window.renderWebView(vscode);
        vscode.postMessage({command: "started"});
      });
    </script>
    </body>
    </html>`;
  }
}

function customCssProperties(): string {
  const vscodeColorMap: VsCodeColorMap = {
    foreground: "--vscode-foreground",
    background: "--vscode-editor-background",
    disabledForeground: "--vscode-disabledForeground",
    border: "--vscode-editorGroup-border",
    focusBorder: "--vscode-focusBorder",
    buttonBorder: "--vscode-button-border",
    buttonBackground: "--vscode-button-background",
    buttonForeground: "--vscode-button-foreground",
    buttonHoverBackground: "--vscode-button-hoverBackground",
    buttonSecondaryBackground: "--vscode-button-secondaryBackground",
    buttonSecondaryForeground: "--vscode-button-secondaryForeground",
    buttonSecondaryHoverBackground: "--vscode-button-secondaryHoverBackground",
    inputBackground: "--vscode-input-background",
    inputForeground: "--vscode-input-foreground",
    inputBorder: "--vscode-input-border",
    tabBorder: "--vscode-tab-border",
    tabActiveBackground: "--vscode-tab-activeBackground",
    tabActiveForeground: "--vscode-tab-activeForeground",
    tabInactiveBackground: "--vscode-tab-inactiveBackground",
    tabInactiveForeground: "--vscode-tab-inactiveForeground",
    dropdownBackground: "--vscode-dropdown-background",
    dropdownBorder: "--vscode-dropdown-border",
    dropdownForeground: "--vscode-dropdown-foreground",
    checkboxBackground: "--vscode-checkbox-background",
    checkboxBorder: "--vscode-checkbox-border",
    checkboxForeground: "--vscode-checkbox-foreground",
    errorForeground: "--vscode-errorForeground",
    errorBackground: "--vscode-inputValidation-errorBackground",
    errorBorder: "--vscode-inputValidation-errorBorder",
    sidebarBackground: "--vscode-sideBar-background",
    listActiveSelectionBackground: "--vscode-list-activeSelectionBackground",
    listActiveSelectionForeground: "--vscode-list-activeSelectionForeground",
    listHoverBackground: "--vscode-list-hoverBackground",
  };

  const props = ThemeColorNames.map((name) => createColorProperty(name, vscodeColorMap[name])).join(
    "\n"
  );

  return `:root { ${props} }`;
}

function createColorProperty(name: ThemeColorName, vsCodeVariable: string): string {
  const variable = ThemeColorVariables[name];
  const customVariable = ThemeColorVariables[name] + "-custom";
  return `${variable}: var(${customVariable}, var(${vsCodeVariable}));`;
}
