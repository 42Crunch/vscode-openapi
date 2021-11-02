/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Configuration } from "./configuration";
import { ParserOptions as Options } from "@xliic/preserving-json-yaml-parser";

export class ParserOptions implements Options {
  configuration: Configuration;
  yaml: { customTags?: { [tag: string]: "scalar" | "sequence" | "mapping" } };

  constructor() {
    this.yaml = {};
  }

  configure(configuration: Configuration) {
    this.configuration = configuration;
    const customTags = configuration.get<[string]>("customTags");
    this.yaml = {
      customTags: this.buildCustomTags(customTags),
    };
    configuration.onDidChange(this.onConfigurationChanged, this);
  }

  get() {
    return {
      yaml: this.yaml,
    };
  }

  onConfigurationChanged(e: vscode.ConfigurationChangeEvent) {
    if (this.configuration.changed(e, "customTags")) {
      const customTags = this.configuration.get<string[]>("customTags");
      this.yaml = {
        customTags: this.buildCustomTags(customTags),
      };
    }
  }

  buildCustomTags(customTags: string[]): { [tag: string]: "scalar" | "sequence" | "mapping" } {
    const tags = {};

    for (const tag of customTags) {
      let [name, type] = tag.split(" ");
      type = type ? type.toLowerCase() : "scalar";
      if (["mapping", "scalar", "sequence"].includes(type)) {
        tags[name] = type;
      }
    }
    return tags;
  }
}

export const parserOptions = new ParserOptions();
