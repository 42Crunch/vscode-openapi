import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { parse, Node } from "@xliic/openapi-ast-node";
import { parserOptions } from "./parser-options";
import { replace } from "@xliic/openapi-ast-node";
import { InsertReplaceRenameFix, FixType, FixContext } from "./types";
import parameterSources from "./audit/quickfix-sources";
import { topTags } from "./commands";

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
  const depth = document.languageId === "yaml" ? target.getDepth() - 1 : target.getDepth();
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

export function renameKeyNode(context: FixContext): vscode.Range {
  const document = context.document;
  const target = context.target;
  const [start, end] = target.getKeyRange();
  return new vscode.Range(document.positionAt(start), document.positionAt(end));
}

export function deleteJsonNode(context: FixContext): vscode.Range {
  const document = context.document;
  const target = context.target;
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

export function deleteYamlNode(context: FixContext): vscode.Range {
  const document = context.document;
  const target = context.target;
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

export function insertJsonNode(context: FixContext, value: string): [string, vscode.Position] {
  const document = context.document;
  const root = context.root;
  const target = context.target;
  const snippet = context.snippet;
  let lastChildTarget: Node;
  const children = target.getChildren();
  const [indent, char] = getBasicIndentation(document, root);
  let start: number, end: number;
  let comma = ",";

  // Insert pointer is either {} or [], nothing else
  if (children) {
    if (children.length > 0) {
      lastChildTarget = children[children.length - 1];
      [start, end] = lastChildTarget.getRange();
    } else {
      [start, end] = target.getRange();
      start += 1;
      end = start;
      comma = "";
      // Snippet identation won't work correctly, add child padding here
      value = char.repeat(indent) + value;
    }
  }

  const index = getCurrentIdentation(document, start);
  const position = document.positionAt(end);
  value = comma + "\n" + (snippet ? value : shift(value, indent, char, index));
  return [value, position];
}

export function insertYamlNode(context: FixContext, value: string): [string, vscode.Position] {
  const document = context.document;
  const root = context.root;
  const target = context.target;
  let insertAtTarget: Node;
  const children = target.getChildren();
  let position: vscode.Position;
  let start: number, end: number;

  if (target.getDepth() === 0) {
    insertAtTarget = findTopLevelInsertionFollower(root, <InsertReplaceRenameFix>context.fix);
    if (insertAtTarget) {
      [start, end] = insertAtTarget.getRange();
      position = document.positionAt(start);
    }
  }

  // Insert pointer is either {} or [], nothing else
  if (!insertAtTarget && children && children.length > 0) {
    insertAtTarget = children[children.length - 1];
    [start, end] = insertAtTarget.getRange();
    position = document.positionAt(end);
    if (position.line + 1 === document.lineCount) {
      position = document.positionAt(start);
    } else {
      position = new vscode.Position(position.line + 1, 0);
    }
  }

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

export function replaceJsonNode(context: FixContext, value: string): [string, vscode.Range] {
  const document = context.document;
  const root = context.root;
  const target = context.target;
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

export function replaceYamlNode(context: FixContext, value: string): [string, vscode.Range] {
  const document = context.document;
  const root = context.root;
  const target = context.target;
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

export function getFixAsJsonString(context: FixContext): string {
  const root = context.root;
  const pointer = context.pointer;
  const snippet = context.snippet;
  const fix = <InsertReplaceRenameFix>context.fix;
  const type = fix.type;
  let text = JSON.stringify(fix.fix, null, "\t").trim();
  if (fix.parameters) {
    text = handleParameters(context, text);
  }
  // For snippets we must escape $ symbol
  if (snippet && (type === FixType.Insert || type === FixType.Replace)) {
    text = text.replace(new RegExp("\\$ref", "g"), "\\$ref");
  }
  const target = root.find(pointer);
  if (target.isObject() && type === FixType.Insert) {
    text = text.replace("{\n\t", "");
    text = text.replace("\n}", "");
    // Replace only trailing \t, i.e. a\t\t\ta\t\ta\t -> a\t\ta\ta
    text = text.replace(new RegExp("\t(?!\t)", "g"), "");
  }
  return text;
}

export function getFixAsYamlString(context: FixContext): string {
  const snippet = context.snippet;
  const fix = <InsertReplaceRenameFix>context.fix;
  const type = fix.type;
  let text = yaml.safeDump(fix.fix).trim();
  if (fix.parameters) {
    text = handleParameters(context, text);
  }
  // For snippets we must escape $ symbol
  if (snippet && (type === FixType.Insert || type === FixType.Replace)) {
    text = text.replace(new RegExp("\\$ref", "g"), "\\$ref");
  }
  // 2 spaces is always the default ident for the safeDump
  return text.replace(new RegExp("  ", "g"), "\t");
}

function findTopLevelInsertionFollower(root: Node, fix: InsertReplaceRenameFix): Node {
  let result: Node;
  const keys = Object.keys(fix.fix);
  if (keys && keys.length === 1) {
    const n = topTags.indexOf(keys[0]);
    if (n >= 0) {
      for (let i = n + 1; i < topTags.length; i++) {
        result = root.find(`/${topTags[i]}`);
        if (result) {
          return result;
        }
      }
    }
  }
  return result;
}

function handleParameters(context: FixContext, text: string): string {
  const replacements = [];
  const { issues, fix, version, bundle, document, snippet } = context;
  const languageId = context.document.languageId;

  const root = safeParse(text, languageId);

  for (const parameter of context.fix.parameters) {
    const pointer = parameter.path;
    const index = replacements.length + 1;
    const replaceKey = parameter.type === "key";
    let phValues = parameter.values;
    const node = root.find(pointer);
    let defaultValue = replaceKey ? node.getKey() : node.getValue();
    let cacheValues = null;

    if (parameter.source && parameterSources[parameter.source]) {
      const source = parameterSources[parameter.source];
      const issue = parameter.fixIndex ? issues[parameter.fixIndex] : issues[0];
      cacheValues = source(issue, fix, parameter, version, bundle, document);
    }

    let finalValue: string;
    if (snippet) {
      finalValue = getPlaceholder(index, defaultValue, phValues, cacheValues);
    } else {
      if (cacheValues && cacheValues.length > 0) {
        finalValue = cacheValues[0];
      } else {
        finalValue = defaultValue;
        // Faster just to skip this replacement, leaving it default as it is
        continue;
      }
    }

    replacements.push({
      pointer: pointer,
      value: finalValue,
      replaceKey: replaceKey,
    });
  }

  return replace(text, languageId, replacements);
}

function getPlaceholder(
  index: number,
  defaultValue: string,
  possibleValues: any[],
  cacheValues: any[]
): string {
  if (cacheValues && cacheValues.length > 0) {
    if (possibleValues) {
      possibleValues = cacheValues;
    } else {
      defaultValue = cacheValues[0];
    }
  }

  if (possibleValues) {
    // Escape comma symbols
    possibleValues = possibleValues.map((value: any) => {
      if (typeof value === "string") {
        return value.replace(new RegExp(",", "g"), "\\,");
      } else {
        return value;
      }
    });
  } else if (typeof defaultValue === "string") {
    // Escape $ and } inside placeholders (for example in regexp)
    defaultValue = defaultValue
      .replace(new RegExp("\\$", "g"), "\\$")
      .replace(new RegExp("}", "g"), "\\}");
  }

  return (
    "${" + index + (possibleValues ? "|" + possibleValues.join() + "|" : ":" + defaultValue) + "}"
  );
}

export function safeParse(text: string, languageId: string): Node {
  const [root, errors] = parse(text, languageId, parserOptions);
  if (errors.length) {
    throw new Error("Can't parse OpenAPI file");
  }
  return root;
}
