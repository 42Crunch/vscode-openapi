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
} from 'vscode';
import { configId } from './constants';

export class Configuration {
  static configure(context: ExtensionContext) {
    context.subscriptions.push(workspace.onDidChangeConfiguration(configuration.onConfigurationChanged, configuration));
  }

  private _onDidChange = new EventEmitter<ConfigurationChangeEvent>();
  get onDidChange(): Event<ConfigurationChangeEvent> {
    return this._onDidChange.event;
  }

  private onConfigurationChanged(e: ConfigurationChangeEvent) {
    if (!e.affectsConfiguration(configId, null!)) {
      return;
    }

    this._onDidChange.fire(e);
  }

  get<T>(section?: string, resource?: Uri | null, defaultValue?: T): T {
    return defaultValue === undefined
      ? workspace
          .getConfiguration(section === undefined ? undefined : configId, resource!)
          .get<T>(section === undefined ? configId : section)!
      : workspace
          .getConfiguration(section === undefined ? undefined : configId, resource!)
          .get<T>(section === undefined ? configId : section, defaultValue)!;
  }

  changed(e: ConfigurationChangeEvent, section: string, resource?: Uri | null) {
    return e.affectsConfiguration(`${configId}.${section}`, resource!);
  }

  update(section: string, value: any, target: ConfigurationTarget, resource?: Uri | null) {
    return workspace
      .getConfiguration(configId, target === ConfigurationTarget.Global ? undefined : resource!)
      .update(section, value, target);
  }
}

export const configuration = new Configuration();
