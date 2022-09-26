import * as vscode from "vscode";
import { Preferences } from "@xliic/common/messages/prefs";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { PlatformContext } from "../types";

import { ScanCodelensProvider } from "./lens";
import commands from "./commands";
import { ScanWebView } from "./view";
import { Configuration } from "../../configuration";

const selectors = {
  json: { language: "json" },
  jsonc: { language: "jsonc" },
  yaml: { language: "yaml" },
};

export function activate(
  context: vscode.ExtensionContext,
  platformContext: PlatformContext,
  cache: Cache,
  configuration: Configuration,
  store: PlatformStore,
  memento: vscode.Memento,
  secrets: vscode.SecretStorage,
  prefs: Record<string, Preferences>
): vscode.Disposable {
  const view = new ScanWebView(
    context.extensionPath,
    cache,
    configuration,
    store,
    memento,
    secrets,
    prefs
  );

  const scanCodelensProvider = new ScanCodelensProvider(cache);

  let disposables: vscode.Disposable[] = [];

  store.onConnectionDidChange(({ connected }) => {
    disposables.forEach((disposable) => disposable.dispose());
    if (connected) {
      disposables = Object.values(selectors).map((selector) =>
        vscode.languages.registerCodeLensProvider(selector, scanCodelensProvider)
      );
    } else {
      disposables = [];
    }
  });

  commands(cache, platformContext, store, view);

  return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
