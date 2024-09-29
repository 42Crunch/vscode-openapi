/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from "path";
import * as vscode from "vscode";

import { Message, Webapp } from "@xliic/common/message";
import { ChangeThemePayload } from "@xliic/common/theme";
import {
  VsCodeColorMap,
  ThemeColorName,
  ThemeColorNames,
  ThemeColorVariables,
} from "@xliic/common/theme";

export abstract class WebView<W extends Webapp<Message, Message>> {
  private panel?: vscode.WebviewPanel;
  private session?: string;

  abstract hostHandlers: W["hostHandlers"];

  constructor(
    private extensionPath: string,
    private viewId: string,
    private viewTitle: string,
    private column: vscode.ViewColumn,
    private icon?: string
  ) {}

  isActive(): boolean {
    return this.panel !== undefined;
  }

  abstract onStart(): Promise<void>;

  protected async sendRequest(request: W["consumes"]): Promise<void> {
    if (this.panel) {
      await this.panel!.webview.postMessage(request);
    } else {
      throw new Error(`Can't send message to ${this.viewId}, webview not initialized`);
    }
  }

  async sendColorTheme(theme: vscode.ColorTheme) {
    const kindMap: Record<vscode.ColorThemeKind, ChangeThemePayload["kind"]> = {
      [vscode.ColorThemeKind.Light]: "light",
      [vscode.ColorThemeKind.Dark]: "dark",
      [vscode.ColorThemeKind.HighContrast]: "highContrast",
      [vscode.ColorThemeKind.HighContrastLight]: "highContrastLight",
    };
    this.sendRequest({ command: "changeTheme", payload: { kind: kindMap[theme.kind] } });
  }

  async handleResponse(response: W["produces"]): Promise<void> {
    const handler = this.hostHandlers[response.command as W["produces"]["command"]];

    if (handler) {
      const result = handler(response.payload);
      if (result instanceof Promise) {
        const request = await result;
        if (request !== undefined) {
          this.sendRequest(request);
        }
      } else {
        for await (const request of result) {
          this.sendRequest(request);
        }
      }
    } else {
      throw new Error(
        `Unable to find response handler for command: ${response.command} in ${this.viewId} webview`
      );
    }
  }

  protected async show(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.panel) {
        this.panel.reveal();
        await this.onStart();
        resolve();
        return;
      }
      // create the panel
      const panel = this.createPanel();
      panel.onDidDispose(() => {
        this.onDispose();
      });
      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "started" && message.session) {
          this.panel = panel;
          this.session = message.session;
          await this.onStart();
          resolve();
        } else {
          this.handleResponse(message as W["produces"]);
        }
      });
    });
  }

  dispose() {
    if (this.panel) {
      this.panel.dispose();
    }
  }

  async onDispose() {
    this.panel = undefined;
  }

  createPanel(): vscode.WebviewPanel {
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

    if (this.icon !== undefined) {
      panel.iconPath = {
        light: vscode.Uri.file(
          path.join(this.extensionPath, "resources", "icons", `${this.icon}.svg`)
        ),
        dark: vscode.Uri.file(
          path.join(this.extensionPath, "resources", "icons", `${this.icon}-dark.svg`)
        ),
      };
    }

    if (process.env["XLIIC_WEB_VIEW_DEV_MODE"] === "true") {
      panel.webview.html = this.getDevHtml(panel);
    } else {
      panel.webview.html = this.getProdHtml(panel);
    }

    return panel;
  }

  private getDevHtml(panel: vscode.WebviewPanel): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"  content="default-src 'none';  img-src https: data: http://localhost:3000/; script-src http://localhost:3000/ 'unsafe-inline'; style-src http://localhost:3000/ 'unsafe-inline'; connect-src http: https: ws:">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <base href="http://localhost:3000/">
      <script type="module">
      import RefreshRuntime from "/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
      </script>
      <script type="module" src="/@vite/client"></script>
      <style>
        ${customCssProperties()}
      </style>
    </head>
    <body>
    <div id="root"></div>
    <script type="module" src="/src/app/${this.viewId}/index.tsx"></script>
    <script>
      window.addEventListener("DOMContentLoaded", (event) => {
        const vscode = acquireVsCodeApi();
        window.renderWebView({
          postMessage: (message) => {
            console.log('sending message', message);
            vscode.postMessage(message);
          }
        });
        vscode.postMessage({command: "started", session: crypto.randomUUID()});
      });
    </script>
    </body>
    </html>`;
  }

  private getProdHtml(panel: vscode.WebviewPanel): string {
    const cspSource = panel.webview.cspSource;
    const script = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.extensionPath, "webview", "generated", "web", `${this.viewId}.js`)
      )
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"  content="default-src 'none';  img-src ${cspSource} https: data:; script-src ${cspSource} 'unsafe-inline'; style-src ${cspSource}  'unsafe-inline'; connect-src http: https:">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style type="text/css">
        ${customCssProperties()}
      </style>
    </head>
    <body>
    <div id="root"></div>  
    <script type="module" src="${script}"></script>
    <script>
      window.addEventListener("DOMContentLoaded", (event) => {
        const vscode = acquireVsCodeApi();
        window.renderWebView(vscode);
        vscode.postMessage({command: "started", session: crypto.randomUUID()});
      });
    </script>
    </body>
    </html>`;
  }
}

function customCssProperties(): string {
  const props = ThemeColorNames.map((name) => createColorProperty(name)).join("\n");
  return `:root { ${props} }`;
}

function createColorProperty(name: ThemeColorName): string {
  if (vscodeColorMap[name] !== undefined) {
    const xliicVarName = ThemeColorVariables[name];
    const vscodeVarName = vscodeColorMap[name];
    return `${xliicVarName}: var(${vscodeVarName});`;
  }

  return "";
}

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
  inputPlaceholderForeground: "--vscode-input-placeholderForeground",
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
  listActiveSelectionBackground: "--vscode-list-activeSelectionBackground",
  listActiveSelectionForeground: "--vscode-list-activeSelectionForeground",
  listHoverBackground: "--vscode-list-hoverBackground",
  contrastActiveBorder: "--vscode-contrastActiveBorder",
  linkForeground: "--vscode-textLink-foreground",
  linkActiveForeground: "--vscode-textLink-activeForeground",
  computedOne: undefined,
  computedTwo: undefined,
  badgeForeground: "--vscode-badge-foreground",
  badgeBackground: "--vscode-badge-background",
  notificationsForeground: "--vscode-notifications-foreground",
  notificationsBackground: "--vscode-notifications-background",
  notificationsBorder: "--vscode-notifications-border",
  fontSize: "--vscode-font-size",
};
