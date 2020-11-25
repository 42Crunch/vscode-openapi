import * as vscode from 'vscode';
import { Node } from '../ast';
import { AstEditHandler } from './types';

export class JsonAstEditHandler extends AstEditHandler {

  constructor(editor: vscode.TextEditor, bulk: boolean) {
    super(editor, bulk);
  }

  getText(pointer: string, type: string, fix: any) : string {
    let text = JSON.stringify(fix, null, '\t').trim();
    // For snippets we must escape $ symbol
    if (!this.bulk && ((type === 'insert') || (type === 'rename'))) {
      text = text.replace(new RegExp('\\$ref', 'g'), '\\$ref')
    }
    const target = this.root.find(pointer);
    if (target.isObject() && (type === 'insert')) {
      text = text.replace('{\n\t', '');
      text = text.replace('\n}', '');
      // Replace only trailing \t, i.e. a\t\t\ta\t\ta\t -> a\t\ta\ta
      text = text.replace(new RegExp('\t(?!\t)', 'g'), '');
    }
    return text;
  }

  rename(pointer: string, value: string): void {

    const target = this.root.find(pointer);
    let start: number, end: number;

     [start, end] = target.getRange();
     if (typeof value === 'string') {
      const isObject = value.startsWith('{') && value.endsWith('}');
      const isArray = value.startsWith('[') && value.endsWith(']');
      if (!isObject && !isArray) {
        value = "\"" + value + "\"";
      }
      else {
        const position = this.document.positionAt(start);
        const line = this.document.lineAt(position.line);
        const index = line.firstNonWhitespaceCharacterIndex;
        const depth = target.getDepth();
        const shift = Math.round(index / depth);
        const p0 = new vscode.Position(position.line, index - 1);
        const p1 = new vscode.Position(position.line, index);
        const char = this.document.getText(new vscode.Range(p0, p1));
        value = value.replace(new RegExp('\n', 'g'), '\n' + char.repeat(index));
        value = value.replace(new RegExp('\t', 'g'), char.repeat(shift));
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
    const index = this.getCurrentIdentation(start);
    const position = this.document.positionAt(end);

    if (this.bulk) {
      value = ',\n' + this.shift(value, index);
      this.output.push([this.document.uri, new vscode.Range(position, position), value]);
    }
    else {
      value = ',\n' + value;
      this.output.push([new vscode.SnippetString(value), position]);
    }
  }

  delete(pointer: string): void {

    const target = this.root.find(pointer);
    let startPosition: vscode.Position;

    if (target.prev()) {
      const line = this.getLineByOffset(target.prev().getRange()[1]);
      startPosition = new vscode.Position(line.lineNumber, line.text.length + (target.next() ? 0 : -1));
    }
    else {
      const line = this.getLineByOffset(target.getParent().getRange()[0]);
      startPosition = new vscode.Position(line.lineNumber, line.text.length);
    }

    const line = this.getLineByOffset(target.getRange()[1]);
    const endPosition = new vscode.Position(line.lineNumber, line.text.length);

    this.output.push([this.document.uri, new vscode.Range(startPosition, endPosition)]);
  }
}
