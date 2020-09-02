import * as yaml from 'js-yaml';
import * as json from 'jsonc-parser';
import * as vscode from 'vscode';

import { ParserOptions } from './parser-options';

const parseJson = (text: string) => {
  const errors = [];
  const parsed = json.parse(text, errors);
  if (errors.length > 0) {
    const message = errors
      .map((error: json.ParseError) => `${json.printParseErrorCode(error.error)} at offset ${error.offset}`)
      .join(', ');
    throw new Error(`Failed to parse JSON: ${message}`);
  }
  return parsed;
};

const parseYaml = (text: string, options: ParserOptions) => {
  const {
    yaml: { schema },
  } = options.get();
  return yaml.safeLoad(text, { schema });
};

export function parseDocument(document: vscode.TextDocument, options: ParserOptions) {
  if (document.languageId === 'yaml') {
    return parseYaml(document.getText(), options);
  }

  return parseJson(document.getText());
}

export const bundlerJsonParser = {
  order: 100,
  canParse: ['.json', '.jsonc'],
  parse: (file: any) => {
    return new Promise((resolve, reject) => {
      let data = file.data;
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }

      if (typeof data === 'string') {
        if (data.trim().length === 0) {
          resolve(undefined); // This mirrors the YAML behavior
        } else {
          resolve(parseJson(data));
        }
      } else {
        // data is already a JavaScript value (object, array, number, null, NaN, etc.)
        resolve(data);
      }
    });
  },
};

export const bundlerYamlParserWithOptions = (options: ParserOptions) => ({
  order: 200,
  canParse: ['.yaml', '.yml'],
  parse: (file: any) => {
    return new Promise((resolve, reject) => {
      let data = file.data;
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }

      if (typeof data === 'string') {
        resolve(parseYaml(data, options));
      } else {
        // data is already a JavaScript value (object, array, number, null, NaN, etc.)
        resolve(data);
      }
    });
  },
});
