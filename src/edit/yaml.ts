import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { Node } from '../ast';
import { AstEditHandler } from './types';
import { TextDecoder } from 'util';

export class YamlAstEditHandler extends AstEditHandler {

  constructor(editor: vscode.TextEditor, bulk: boolean) {
    super(editor, bulk);
  }

  getText(pointer: string, type: string, fix: any) : string {
    let text = yaml.safeDump(fix).trim();
    // For snippets we must escape $ symbol
    if (!this.bulk && ((type === 'insert') || (type === 'rename'))) {
      text = text.replace(new RegExp('\\$ref', 'g'), '\\$ref')
    }
    // 2 spaces is always the default ident for the safeDump
    return text.replace(new RegExp('  ', 'g'), '\t');
  }

  rename(pointer: string, value: string): void {

    const target = this.root.find(pointer);
    let start: number, end: number;

    [start, end] = target.getValueRange();
    if (typeof value === 'string') {
      if (AstEditHandler.isYamlObject(value) || AstEditHandler.isYamlArray(value)) {
        const position = this.document.positionAt(start);
        const line = this.document.lineAt(position.line);
        const index = line.firstNonWhitespaceCharacterIndex;
        const depth = target.getDepth();
        const shift = Math.round(index / depth);
        const p0 = new vscode.Position(position.line, index - 1);
        const p1 = new vscode.Position(position.line, index);
        const char = this.document.getText(new vscode.Range(p0, p1));
        // insert as value into key-value pair
        if (target.getChildren().length === 0) {
          value = '\n\t' + value;
          value = value.replace(new RegExp('\n', 'g'), '\n' + char.repeat(index));
          value = value.replace(new RegExp('\t', 'g'), char.repeat(shift));  
        } 
        else {
          value = value + (AstEditHandler.isYamlObject(line.text) ? '' : '\n');
          value = value.replace(new RegExp('\n', 'g'), '\n' + char.repeat(index - shift));
          value = value.replace(new RegExp('\t', 'g'), char.repeat(shift));  
        }
        // todo: insert as value into array place
      }
    }
    else {
      value = String(value);
    }

    // todo
    //this.edit.replace(this.document.uri, new vscode.Range(this.document.positionAt(start), this.document.positionAt(end)), value);
  }

  // Insert pointer is either {} or [], nothing else
  insert(pointer: string, value: string): void {

    let lastChildTarget: Node;
    const target = this.root.find(pointer);
    const children = target.getChildren();

    if (children && children.length > 0) {
      lastChildTarget = children[children.length - 1];
    }

    const [start, end] = lastChildTarget.getRange();
    let position = this.document.positionAt(end);
    position = new vscode.Position(position.line + 1, 0);
    const index = this.getCurrentIdentation(start);
    let apply = false;

    if (target.isObject()) {
      value = this.shift(value, index) + '\n';
      apply = true;
    }
    else if (target.isArray()) {
      value = this.shift('- ' + value, index, '- '.length) + '\n';
      apply = true;
    }

    if (apply) {
      if (this.bulk) {
        this.output.push([this.document.uri, new vscode.Range(position, position), value]);
      }
      else {
        this.output.push([new vscode.SnippetString(value), position]);
      }
    }
  }

  delete(pointer: string): void {

    const target = this.root.find(pointer);
    const [start, end] = target.getRange();

    let apply = false;
    let startPosition = this.document.positionAt(start);
    let endPosition = this.document.positionAt(end);

    if (target.getParent().isArray()) {
      if (target.next()) {
        const line = this.getLineByOffset(target.next().getRange()[0]);
        startPosition = this.document.positionAt(start - '- '.length);
        endPosition = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
      }
      else {
        startPosition = new vscode.Position(this.getLineByOffset(start).lineNumber, 0);
        endPosition = new vscode.Position(this.getLineByOffset(end).lineNumber + 1, 0);
      }
      apply = true;
    }
    else if (target.getParent().isObject()) {
      if (target.next()) {
        const line = this.getLineByOffset(target.next().getRange()[0]);
        endPosition = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
      }
      else {
        startPosition = new vscode.Position(this.getLineByOffset(start).lineNumber, 0);
        endPosition = new vscode.Position(this.getLineByOffset(end).lineNumber + 1, 0);
      }
      apply = true;
    }

    if (apply) {
      this.output.push([this.document.uri, new vscode.Range(startPosition, endPosition)]);
    }
  }
}
