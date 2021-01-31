/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import {
  ConfigurationChangeEvent,
  ConfigurationTarget,
  Event,
  EventEmitter,
  ExtensionContext,
  Uri,
  workspace,
  WorkspaceConfiguration,
} from "vscode";
import { configId } from "./types";

export class Configuration {
  private section: string;

  constructor(section: string) {
    this.section = section;
  }

  configure(context: ExtensionContext) {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(this.onConfigurationChanged, this)
    );
  }

  private _onDidChange = new EventEmitter<ConfigurationChangeEvent>();

  get onDidChange(): Event<ConfigurationChangeEvent> {
    return this._onDidChange.event;
  }

  private onConfigurationChanged(e: ConfigurationChangeEvent) {
    if (!e.affectsConfiguration(this.section)) {
      return;
    }

    this._onDidChange.fire(e);
  }

  changed(e: ConfigurationChangeEvent, section: string, resource?: Uri | null) {
    return e.affectsConfiguration(`${this.section}.${section}`, resource!);
  }

  get<T>(section: string, defaultValue?: T): T {
    return defaultValue === undefined
      ? workspace.getConfiguration(this.section).get<T>(section)!
      : workspace.getConfiguration(this.section).get<T>(section, defaultValue)!;
  }

  update(section: string, value: any, configurationTarget?: ConfigurationTarget) {
    return workspace.getConfiguration(this.section).update(section, value, configurationTarget);
  }
}

export const configuration = new Configuration(configId);
