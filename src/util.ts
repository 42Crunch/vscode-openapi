import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { OpenApiVersion } from './types';
import { parse, Node } from './ast';
import { parserOptions } from './parser-options';

export function parseDocument(document: vscode.TextDocument): [OpenApiVersion, Node, vscode.Diagnostic[]] {
  if (!(document.languageId === 'json' || document.languageId === 'jsonc' || document.languageId == 'yaml')) {
    return [OpenApiVersion.Unknown, null, null];
  }

  const [node, errors] = parse(document.getText(), document.languageId, parserOptions);
  const version = getOpenApiVersion(node);
  const messages = errors.map(
    (error): vscode.Diagnostic => {
      const position = document.positionAt(error.offset);
      const line = document.lineAt(position);
      return {
        source: 'vscode-openapi',
        code: '',
        severity: vscode.DiagnosticSeverity.Error,
        message: error.message,
        range: line.range,
      };
    },
  );

  return [version, node, messages.length > 0 ? messages : null];
}

export function getOpenApiVersion(root: Node): OpenApiVersion {
  const swaggerVersionValue = root?.find('/swagger')?.getValue();
  const openApiVersionValue = root?.find('/openapi')?.getValue();

  if (swaggerVersionValue === '2.0') {
    return OpenApiVersion.V2;
  }

  if (openApiVersionValue && typeof openApiVersionValue === 'string' && openApiVersionValue.match(/^3\.0\.\d(-.+)?$/)) {
    return OpenApiVersion.V3;
  }

  return OpenApiVersion.Unknown;
}

export async function provideYamlSchemas(context: vscode.ExtensionContext, yamlExtension: vscode.Extension<any>) {
  if (!yamlExtension.isActive) {
    await yamlExtension.activate();
  }

  function requestSchema(uri: string) {
    for (const document of vscode.workspace.textDocuments) {
      if (document.uri.toString() === uri) {
        const [node] = parse(document.getText(), 'yaml', parserOptions);
        const version = getOpenApiVersion(node);
        if (version === OpenApiVersion.V2) {
          return 'openapi:v2';
        } else if (version === OpenApiVersion.V3) {
          return 'openapi:v3';
        }
        break;
      }
    }
    return null;
  }

  function requestSchemaContent(uri: string) {
    if (uri === 'openapi:v2') {
      const filename = path.join(context.extensionPath, 'schema', 'openapi-2.0.json');
      return fs.readFileSync(filename, { encoding: 'utf8' });
    } else if (uri === 'openapi:v3') {
      const filename = path.join(context.extensionPath, 'schema', 'openapi-3.0-2019-04-02.json');
      return fs.readFileSync(filename, { encoding: 'utf8' });
    }
    return null;
  }

  const schemaContributor = yamlExtension.exports;
  schemaContributor.registerContributor('openapi', requestSchema, requestSchemaContent);
}

function getBasicIndentation(document: vscode.TextDocument, root: Node): [number, string] {
  let target: Node;
  for (let child of root.getChildren()) {
    if (child.isObject()) {
      const tmp = child.getChildren();
      if (tmp && tmp.length > 0) {
        target = tmp[0];
      }
    }
  }
  const position = document.positionAt(target.getRange()[0]);
  const index = document.lineAt(position.line).firstNonWhitespaceCharacterIndex;
  const p0 = new vscode.Position(position.line, index - 1);
  const p1 = new vscode.Position(position.line, index);
  const depth = (document.languageId === 'json') ? target.getDepth() : (target.getDepth() - 1);
  return [Math.round(index / depth), document.getText(new vscode.Range(p0, p1))];
}

function getCurrentIdentation(document: vscode.TextDocument, offset: number): number {
  const position = document.positionAt(offset);
  const line = document.lineAt(position.line);
  return line.firstNonWhitespaceCharacterIndex;
}

function getLineByOffset(document: vscode.TextDocument, offset: number): vscode.TextLine {
  return document.lineAt(document.positionAt(offset).line);
}

function shift(text: string, indent: number, char: string, padding: number, extra: number = 0) : string {
  text = char.repeat(padding) + text;
  text = text.replace(new RegExp('\n', 'g'), '\n' + char.repeat(padding + extra));
  text = text.replace(new RegExp('\t', 'g'), char.repeat(indent)); 
  return text;
}

// todo: replace to ast stuff
// static isYamlArray(text: string): boolean {
//   const i1 = text.indexOf(':');
//   const i2 = text.indexOf('- ');
//   return (i2 >= 0) && ((i1 < 0) || ((i1 > 0) && (i1 > i2)));
// }

// static isYamlObject(text: string): boolean {
//   const i1 = text.indexOf(':');
//   const i2 = text.indexOf('- ');
//   return (i1 > 0) && ((i2 < 0) || ((i2 > 0) && (i2 > i1)));
// }

export function renameKeyNode(document: vscode.TextDocument, root: Node, pointer: string): vscode.Range {
  const [start, end] = root.find(pointer).getKeyRange();
  return new vscode.Range(document.positionAt(start), document.positionAt(end));
}

export function deleteJsonNode(document: vscode.TextDocument, root: Node, pointer: string): vscode.Range {

  const target = root.find(pointer);
  let startPosition: vscode.Position;

  if (target.prev()) {
    const line = getLineByOffset(document, target.prev().getRange()[1]);
    startPosition = new vscode.Position(line.lineNumber, line.text.length + (target.next() ? 0 : -1));
  }
  else {
    const line = getLineByOffset(document, target.getParent().getRange()[0]);
    startPosition = new vscode.Position(line.lineNumber, line.text.length);
  }

  const line = getLineByOffset(document, target.getRange()[1]);
  const endPosition = new vscode.Position(line.lineNumber, line.text.length);

  return new vscode.Range(startPosition, endPosition);
}

export function deleteYamlNode(document: vscode.TextDocument, root: Node, pointer: string): vscode.Range {

  const target = root.find(pointer);
  const [start, end] = target.getRange();

  let apply = false;
  let startPosition = document.positionAt(start);
  let endPosition = document.positionAt(end);

  if (target.getParent().isArray()) {
    if (target.next()) {
      const line = getLineByOffset(document, target.next().getRange()[0]);
      startPosition = document.positionAt(start - '- '.length);
      endPosition = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
    }
    else {
      startPosition = new vscode.Position(getLineByOffset(document, start).lineNumber, 0);
      endPosition = new vscode.Position(getLineByOffset(document, end).lineNumber + 1, 0);
    }
    apply = true;
  }
  else if (target.getParent().isObject()) {
    if (target.next()) {
      const line = getLineByOffset(document, target.next().getRange()[0]);
      endPosition = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
    }
    else {
      startPosition = new vscode.Position(getLineByOffset(document, start).lineNumber, 0);
      endPosition = new vscode.Position(getLineByOffset(document, end).lineNumber + 1, 0);
    }
    apply = true;
  }

  if (apply) {
    return new vscode.Range(startPosition, endPosition);
  }
}

export function insertJsonNode(document: vscode.TextDocument, root: Node, pointer: string, value: string, snippet: boolean = true): [string, vscode.Position] {

  let lastChildTarget: Node;
  const target = root.find(pointer);
  const children = target.getChildren();

  // Insert pointer is either {} or [], nothing else
  if (children && children.length > 0) {
    lastChildTarget = children[children.length - 1];
  }
  
  const [start, end] = lastChildTarget.getRange();
  const index = getCurrentIdentation(document, start);
  const position = document.positionAt(end);
  const [indent, char] = getBasicIndentation(document, root);
  value = snippet ? ',\n' + value : ',\n' + shift(value, indent, char, index);  
  return [value, position];
}

export function insertYamlNode(document: vscode.TextDocument, root: Node, pointer: string, value: string): [string, vscode.Position] {

  let lastChildTarget: Node;
  const target = root.find(pointer);
  const children = target.getChildren();

  // Insert pointer is either {} or [], nothing else
  if (children && children.length > 0) {
    lastChildTarget = children[children.length - 1];
  }

  const [start, end] = lastChildTarget.getRange();
  let position = document.positionAt(end);
  position = new vscode.Position(position.line + 1, 0);
  const index = getCurrentIdentation(document, start);
  let apply = false;
  const [indent, char] = getBasicIndentation(document, root);

  if (target.isObject()) {
    value = shift(value, indent, char, index) + '\n';
    apply = true;
  }
  else if (target.isArray()) {
    value = shift('- ' + value, indent, char, index, '- '.length) + '\n';
    apply = true;
  }

  if (apply) {
    return [value, position];
  }
}

export function replaceJsonNode(document: vscode.TextDocument, root: Node, pointer: string, value: string): [string, vscode.Range] {

  // const target = this.root.find(pointer);
  // let start: number, end: number;

  //  [start, end] = target.getRange();
  //  if (typeof value === 'string') {
  //   const isObject = value.startsWith('{') && value.endsWith('}');
  //   const isArray = value.startsWith('[') && value.endsWith(']');
  //   if (!isObject && !isArray) {
  //     value = "\"" + value + "\"";
  //   }
  //   else {
  //     const position = this.document.positionAt(start);
  //     const line = this.document.lineAt(position.line);
  //     const index = line.firstNonWhitespaceCharacterIndex;
  //     const depth = target.getDepth();
  //     const shift = Math.round(index / depth);
  //     const p0 = new vscode.Position(position.line, index - 1);
  //     const p1 = new vscode.Position(position.line, index);
  //     const char = this.document.getText(new vscode.Range(p0, p1));
  //     value = value.replace(new RegExp('\n', 'g'), '\n' + char.repeat(index));
  //     value = value.replace(new RegExp('\t', 'g'), char.repeat(shift));
  //   }
  //  }
  //  else {
  //   value = String(value);
  //  }

   // todo
   //this.edit.replace(this.document.uri, new vscode.Range(this.document.positionAt(start), this.document.positionAt(end)), value);
   return ['', new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))];
}

export function replaceYamlNode(document: vscode.TextDocument, root: Node, pointer: string, value: string): [string, vscode.Range] {

  // const target = this.root.find(pointer);
  // let start: number, end: number;

  // [start, end] = target.getValueRange();
  // if (typeof value === 'string') {
  //   if (AstEditHandler.isYamlObject(value) || AstEditHandler.isYamlArray(value)) {
  //     const position = this.document.positionAt(start);
  //     const line = this.document.lineAt(position.line);
  //     const index = line.firstNonWhitespaceCharacterIndex;
  //     const depth = target.getDepth();
  //     const shift = Math.round(index / depth);
  //     const p0 = new vscode.Position(position.line, index - 1);
  //     const p1 = new vscode.Position(position.line, index);
  //     const char = this.document.getText(new vscode.Range(p0, p1));
  //     // insert as value into key-value pair
  //     if (target.getChildren().length === 0) {
  //       value = '\n\t' + value;
  //       value = value.replace(new RegExp('\n', 'g'), '\n' + char.repeat(index));
  //       value = value.replace(new RegExp('\t', 'g'), char.repeat(shift));  
  //     } 
  //     else {
  //       value = value + (AstEditHandler.isYamlObject(line.text) ? '' : '\n');
  //       value = value.replace(new RegExp('\n', 'g'), '\n' + char.repeat(index - shift));
  //       value = value.replace(new RegExp('\t', 'g'), char.repeat(shift));  
  //     }
  //     // todo: insert as value into array place
  //   }
  // }
  // else {
  //   value = String(value);
  // }

  // todo
  //this.edit.replace(this.document.uri, new vscode.Range(this.document.positionAt(start), this.document.positionAt(end)), value);

  return ['', new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))];
}

export function getFixAsJsonString(root: Node, pointer: string, type: string, fix: any, parameters: any, snippet: boolean) : string {
  let text = JSON.stringify(fix, null, '\t').trim();
  // For snippets we must escape $ symbol
  if (snippet && ((type === 'insert') || (type === 'rename'))) {
    text = text.replace(new RegExp('\\$ref', 'g'), '\\$ref')
  }
  const target = root.find(pointer);
  if (target.isObject() && (type === 'insert')) {
    text = text.replace('{\n\t', '');
    text = text.replace('\n}', '');
    // Replace only trailing \t, i.e. a\t\t\ta\t\ta\t -> a\t\ta\ta
    text = text.replace(new RegExp('\t(?!\t)', 'g'), '');
  }
  return text;
}

export function getFixAsYamlString(root: Node, pointer: string, type: string, fix: any, parameters: any, snippet: boolean) : string {
  let text = yaml.safeDump(fix).trim();
  // For snippets we must escape $ symbol
  if (snippet && ((type === 'insert') || (type === 'rename'))) {
    text = text.replace(new RegExp('\\$ref', 'g'), '\\$ref')
  }
  // 2 spaces is always the default ident for the safeDump
  return text.replace(new RegExp('  ', 'g'), '\t');
}
