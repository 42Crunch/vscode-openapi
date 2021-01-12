import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { parse, Node } from "./ast";
import { parserOptions } from "./parser-options";
import { replace } from "./ast/replace";

type FixParameters = {
  name: string;
  path: string;
  values?: any[];
  type?: string;
};

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
  const depth = document.languageId === "json" ? target.getDepth() : target.getDepth() - 1;
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

function getTopLineByOffset(document: vscode.TextDocument, offset: number): vscode.TextLine {
  return document.lineAt(document.positionAt(offset).line - 1);
}

function shift(
  text: string,
  indent: number,
  char: string,
  padding: number,
  extra: number = 0,
  addFirstPadding: boolean = true
): string {
  if (addFirstPadding) {
    text = char.repeat(padding) + text;
  }
  text = text.replace(new RegExp("\n", "g"), "\n" + char.repeat(padding + extra));
  text = text.replace(new RegExp("\t", "g"), char.repeat(indent));
  return text;
}

export function renameKeyNode(
  document: vscode.TextDocument,
  root: Node,
  pointer: string
): vscode.Range {
  const [start, end] = root.find(pointer).getKeyRange();
  return new vscode.Range(document.positionAt(start), document.positionAt(end));
}

export function deleteJsonNode(
  document: vscode.TextDocument,
  root: Node,
  pointer: string
): vscode.Range {
  const target = root.find(pointer);
  let startPosition: vscode.Position;

  if (target.prev()) {
    const line = getLineByOffset(document, target.prev().getRange()[1]);
    startPosition = new vscode.Position(
      line.lineNumber,
      line.text.length + (target.next() ? 0 : -1)
    );
  } else {
    const line = getLineByOffset(document, target.getParent().getRange()[0]);
    startPosition = new vscode.Position(line.lineNumber, line.text.length);
  }

  const line = getLineByOffset(document, target.getRange()[1]);
  const endPosition = new vscode.Position(line.lineNumber, line.text.length);

  return new vscode.Range(startPosition, endPosition);
}

export function deleteYamlNode(
  document: vscode.TextDocument,
  root: Node,
  pointer: string
): vscode.Range {
  const target = root.find(pointer);
  const [start, end] = target.getRange();

  let apply = false;
  let startPosition = document.positionAt(start);
  let endPosition = document.positionAt(end);

  if (target.getParent().isArray()) {
    if (target.next()) {
      const line = getLineByOffset(document, target.next().getRange()[0]);
      startPosition = document.positionAt(start - "- ".length);
      endPosition = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
    } else {
      startPosition = new vscode.Position(getLineByOffset(document, start).lineNumber, 0);
      endPosition = new vscode.Position(getLineByOffset(document, end).lineNumber + 1, 0);
    }
    apply = true;
  } else if (target.getParent().isObject()) {
    if (target.next()) {
      const line = getLineByOffset(document, target.next().getRange()[0]);
      endPosition = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
    } else {
      startPosition = new vscode.Position(getLineByOffset(document, start).lineNumber, 0);
      endPosition = new vscode.Position(getLineByOffset(document, end).lineNumber + 1, 0);
    }
    apply = true;
  }

  if (apply) {
    return new vscode.Range(startPosition, endPosition);
  }
}

export function insertJsonNode(
  document: vscode.TextDocument,
  root: Node,
  pointer: string,
  value: string,
  snippet: boolean = true
): [string, vscode.Position] {
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
  value = snippet ? ",\n" + value : ",\n" + shift(value, indent, char, index);
  return [value, position];
}

export function insertYamlNode(
  document: vscode.TextDocument,
  root: Node,
  pointer: string,
  value: string
): [string, vscode.Position] {
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
  const [indent, char] = getBasicIndentation(document, root);

  if (target.isObject()) {
    value = shift(value, indent, char, index) + "\n";
    return [value, position];
  } else if (target.isArray()) {
    value = shift("- " + value, indent, char, index, "- ".length) + "\n";
    return [value, position];
  }
}

export function replaceJsonNode(
  document: vscode.TextDocument,
  root: Node,
  pointer: string,
  value: string
): [string, vscode.Range] {
  const target = root.find(pointer);
  const [start, end] = target.getRange();

  const isObject = value.startsWith("{") && value.endsWith("}");
  const isArray = value.startsWith("[") && value.endsWith("]");

  if (isObject || isArray) {
    const index = getCurrentIdentation(document, start);
    const [indent, char] = getBasicIndentation(document, root);
    value = shift(value, indent, char, index, 0, false);
  }
  return [value, new vscode.Range(document.positionAt(start), document.positionAt(end))];
}

export function replaceYamlNode(
  document: vscode.TextDocument,
  root: Node,
  pointer: string,
  value: string
): [string, vscode.Range] {
  const target = root.find(pointer);
  const [start, end] = target.getValueRange();

  const i1 = value.indexOf(":");
  const i2 = value.indexOf("- ");
  const isObject = i1 > 0 && (i2 < 0 || (i2 > 0 && i2 > i1));
  const isArray = i2 >= 0 && (i1 < 0 || (i1 > 0 && i1 > i2));

  if (isObject || isArray) {
    const index = getCurrentIdentation(document, start);
    const [indent, char] = getBasicIndentation(document, root);
    // Last array member end offset may be at the beggining of the next key node (next line)
    // In this case we must keep ident + \n symbols
    if (target.isArray()) {
      const line = getLineByOffset(document, end);
      // But do not handle the case if the last array member = the last item in the doc
      if (!line.text.trim().startsWith("-")) {
        const line = getTopLineByOffset(document, end);
        const endPosition = new vscode.Position(line.lineNumber, line.text.length);
        value = shift(value, indent, char, index, 0, false);
        return [value, new vscode.Range(document.positionAt(start), endPosition)];
      }
    }
    // Replace plain value with not plain one (add a new line)
    if (!(target.isArray() || target.isObject()) && target.getParent().isObject()) {
      value = shift("\n" + value, indent, char, index, indent, false);
    }
  }
  return [value, new vscode.Range(document.positionAt(start), document.positionAt(end))];
}

export function getFixAsJsonString(
  root: Node,
  pointer: string,
  type: string,
  fix: object,
  parameters: FixParameters[],
  snippet: boolean
): string {
  let text = JSON.stringify(fix, null, "\t").trim();
  if (parameters) {
    text = insertPlaceholders(text, fix, parameters, "json");
  }
  // For snippets we must escape $ symbol
  if (snippet && (type === "insert" || type === "rename")) {
    text = text.replace(new RegExp("\\$ref", "g"), "\\$ref");
  }
  const target = root.find(pointer);
  if (target.isObject() && type === "insert") {
    text = text.replace("{\n\t", "");
    text = text.replace("\n}", "");
    // Replace only trailing \t, i.e. a\t\t\ta\t\ta\t -> a\t\ta\ta
    text = text.replace(new RegExp("\t(?!\t)", "g"), "");
  }
  return text;
}

export function getFixAsYamlString(
  root: Node,
  pointer: string,
  type: string,
  fix: object,
  parameters: FixParameters[],
  snippet: boolean
): string {
  let text = yaml.safeDump(fix).trim();
  if (parameters) {
    text = insertPlaceholders(text, fix, parameters, "yaml");
  }
  // For snippets we must escape $ symbol
  if (snippet && (type === "insert" || type === "rename")) {
    text = text.replace(new RegExp("\\$ref", "g"), "\\$ref");
  }
  // 2 spaces is always the default ident for the safeDump
  return text.replace(new RegExp("  ", "g"), "\t");
}

function insertPlaceholders(
  text: string,
  fix: object,
  parameters: FixParameters[],
  languageId: string
): string {
  const replacements = [];
  const root = safeParse(text, languageId);

  for (const parameter of parameters) {
    const pointer = parameter.path;
    const index = replacements.length + 1;
    const replaceKey = parameter.type === "key";
    let values = parameter.values;
    const node = root.find(pointer);
    let placeholderValue = replaceKey ? node.getKey() : node.getValue();

    if (!values && typeof placeholderValue === "string") {
      // Escape $ and } inside placeholders (for example in regexp)
      placeholderValue = placeholderValue
        .replace(new RegExp("\\$", "g"), "\\$")
        .replace(new RegExp("}", "g"), "\\}");
    }
    replacements.push({
      pointer: pointer,
      value: getPlaceholder(index, placeholderValue, false, values),
      replaceKey: replaceKey,
    });
  }
  return replace(text, languageId, replacements);
}

function getPlaceholder(index: number, value: string, quotes: boolean, values: any[]): string {
  if (values) {
    values = values.map((value: any) => {
      if (typeof value === "string") {
        return value.replace(new RegExp(",", "g"), "\\,"); // Escape comma symbols
      } else {
        return value;
      }
    });
  }
  const placeholer = "${" + index + (values ? "|" + values.join() + "|" : ":" + value) + "}";
  return quotes ? '"' + placeholer + '"' : placeholer;
}

export function safeParse(text: string, languageId: string): Node {
  const [root, errors] = parse(text, languageId, parserOptions);
  if (errors.length) {
    throw new Error("Can't parse OpenAPI file");
  }
  return root;
}
