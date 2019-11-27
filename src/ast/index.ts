/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as json from 'jsonc-parser';
import * as yaml from 'yaml-ast-parser';
import { Kind, Node } from './types';
import { JsonNode } from './json';
import { YamlNode } from './yaml';

export function parse(text: string, languageId: string): [Node, any[]] {
  return languageId === 'yaml' ? parseYaml(text) : parseJson(text);
}

export function parseJson(text: string): [JsonNode, any[]] {
  const parseErrors = [];
  const node = new JsonNode(json.parseTree(text, parseErrors));
  const normalizedErrors = parseErrors.map(error => ({
    message: json.printParseErrorCode(error.error),
    offset: error.offset,
  }));

  return [node, normalizedErrors];
}

export function parseYaml(text: string): [YamlNode, any[]] {
  const tree = yaml.load(text);
  const node = new YamlNode(tree);

  const normalizedErrors = tree.errors.map(error => ({
    message: error.message,
    offset: error.mark ? error.mark.position : 0,
  }));

  return [node, normalizedErrors];
}

export { Kind, Node, JsonNode, YamlNode };
