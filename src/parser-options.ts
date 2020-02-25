/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import { Schema, Type } from 'js-yaml';
import { Configuration } from './configuration';

export class ParserOptions {
  configuration: Configuration;
  yamlSchema: Schema;

  constructor() {
    this.yamlSchema = this.buildYamlSchema([]);
  }

  configure(configuration: Configuration) {
    this.configuration = configuration;
    const customTags = configuration.get<[string]>('customTags');
    this.yamlSchema = this.buildYamlSchema(customTags);
    configuration.onDidChange(this.onConfigurationChanged, this);
  }

  get() {
    return {
      yaml: { schema: this.yamlSchema },
    };
  }

  onConfigurationChanged(e: vscode.ConfigurationChangeEvent) {
    if (this.configuration.changed(e, 'customTags')) {
      const customTags = this.configuration.get<string[]>('customTags');
      this.yamlSchema = this.buildYamlSchema(customTags);
    }
  }

  buildYamlSchema(customTags: string[]) {
    const filteredTags = filterInvalidCustomTags(customTags);

    const schemaWithAdditionalTags = Schema.create(
      filteredTags.map(tag => {
        const typeInfo = tag.split(' ');
        return new Type(typeInfo[0], { kind: (typeInfo[1] && typeInfo[1].toLowerCase()) || 'scalar' });
      }),
    );

    const tagWithAdditionalItems = new Map<string, string[]>();
    filteredTags.forEach(tag => {
      const typeInfo = tag.split(' ');
      const tagName = typeInfo[0];
      const tagType = (typeInfo[1] && typeInfo[1].toLowerCase()) || 'scalar';
      if (tagWithAdditionalItems.has(tagName)) {
        tagWithAdditionalItems.set(tagName, tagWithAdditionalItems.get(tagName).concat([tagType]));
      } else {
        tagWithAdditionalItems.set(tagName, [tagType]);
      }
    });

    tagWithAdditionalItems.forEach((additionalTagKinds, key) => {
      const newTagType = new Type(key, { kind: additionalTagKinds[0] || 'scalar' });
      newTagType.additionalKinds = additionalTagKinds;
      schemaWithAdditionalTags.compiledTypeMap[key] = newTagType;
    });

    return schemaWithAdditionalTags;
  }
}

export function filterInvalidCustomTags(customTags: string[]): string[] {
  const validCustomTags = ['mapping', 'scalar', 'sequence'];

  return customTags.filter(tag => {
    if (typeof tag === 'string') {
      const typeInfo = tag.split(' ');
      const type = (typeInfo[1] && typeInfo[1].toLowerCase()) || 'scalar';

      // We need to check if map is a type because map will throw an error within the yaml-ast-parser
      if (type === 'map') {
        return false;
      }

      return validCustomTags.indexOf(type) !== -1;
    }
    return false;
  });
}

export const parserOptions = new ParserOptions();
