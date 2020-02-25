/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Kind, Node } from './types';
import { parseJson, JsonNode } from './json';
import { parseYaml, findYamlNodeAtOffset, YamlNode } from './yaml';
import { ParserOptions } from '../parser-options';

function parse(text: string, languageId: string, options: ParserOptions): [Node, any[]] {
  return languageId === 'yaml' ? parseYaml(text, options.get().yaml.schema) : parseJson(text);
}

export { parse, parseYaml, parseJson, findYamlNodeAtOffset, Kind, Node, JsonNode, YamlNode };
