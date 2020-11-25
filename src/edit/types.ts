import * as vscode from 'vscode';
import { parse, Node } from '../ast';
import { parserOptions } from '../parser-options';

export abstract class AstEditHandler {

  document: vscode.TextDocument;
  bulk: boolean;
  root: Node;
  output: Array<any>;
  indent: number;
  char: string;

  constructor(editor: vscode.TextEditor, bulk: boolean) {
    this.document = editor.document;
    this.bulk = bulk;
    this.root = AstEditHandler.safeParse(this.document.getText(), this.document.languageId);
    this.output = [];
    this.detectIndentation();
  }

  abstract getText(pointer: string, type: string, fix: any) : string;
  abstract rename(pointer: string, value: string): void;
  abstract insert(pointer: string, value: string): void;
  abstract delete(pointer: string): void;

  renameKey(pointer: string, key: string): void {
    const [start, end] = this.root.find(pointer).getKeyRange();
    this.output.push(this.document.uri, new vscode.Range(this.document.positionAt(start), this.document.positionAt(end)), key);
  }

  apply(pointer: string, fix: any) {
    if (fix.type === 'insert') {
      this.insert(pointer, this.getText(pointer, fix.type, fix.fix));
    }
    else if (fix.type === 'rename') {
      this.rename(pointer, this.getText(pointer, fix.type, fix.fix));
    }
    else if (fix.type === 'renameKey') {
      this.renameKey(pointer, this.getText(pointer, fix.type, fix.fix));
    }
    else if (fix.type === 'delete') {
      this.delete(pointer);
    }
  }

  async finish(): Promise<void> {
    if (this.bulk) {
      const edit = new vscode.WorkspaceEdit();
      for (let args of this.output) {
        edit.replace.apply(edit, args);
      }
      await vscode.workspace.applyEdit(edit);
    }
    else if (this.output.length == 1) {
      const args = this.output[0];
      if (args[0] instanceof vscode.SnippetString) {
        const editor = vscode.window.activeTextEditor;
        await editor.insertSnippet.apply(editor, args);
      }
      else {
        const edit = new vscode.WorkspaceEdit();
        edit.replace.apply(edit, args);
        await vscode.workspace.applyEdit(edit);
      }
    }
  }

  detectIndentation(): void {
    let target: Node;
    for (let child of this.root.getChildren()) {
      if (child.isObject()) {
        const tmp = child.getChildren();
        if (tmp && tmp.length > 0) {
          target = tmp[0];
        }
      }
    }
    const position = this.document.positionAt(target.getRange()[0]);
    const index = this.document.lineAt(position.line).firstNonWhitespaceCharacterIndex;
    const p0 = new vscode.Position(position.line, index - 1);
    const p1 = new vscode.Position(position.line, index);
    const depth = (this.document.languageId === 'json') ? target.getDepth() : (target.getDepth() - 1);
    this.indent = Math.round(index / depth);
    this.char = this.document.getText(new vscode.Range(p0, p1));
  }

  getCurrentIdentation(offset: number): number {
    const position = this.document.positionAt(offset);
    const line = this.document.lineAt(position.line);
    return line.firstNonWhitespaceCharacterIndex;
  }

  getLineByOffset(offset: number): vscode.TextLine {
    return this.document.lineAt(this.document.positionAt(offset).line);
  }

  shift(text: string, padding: number, extra: number = 0) : string {
    text = this.char.repeat(padding) + text;
    text = text.replace(new RegExp('\n', 'g'), '\n' + this.char.repeat(padding + extra));
    text = text.replace(new RegExp('\t', 'g'), this.char.repeat(this.indent)); 
    return text;
  }

  static safeParse(text: string, languageId: string): Node {
    const [root, errors] = parse(text, languageId, parserOptions);
    if (errors.length) {
      throw new Error("Can't parse OpenAPI file");
    }
    return root;
  }

  // todo: replace to ast stuff
  static isYamlArray(text: string): boolean {
    const i1 = text.indexOf(':');
    const i2 = text.indexOf('- ');
    return (i2 >= 0) && ((i1 < 0) || ((i1 > 0) && (i1 > i2)));
  }
  
  static isYamlObject(text: string): boolean {
    const i1 = text.indexOf(':');
    const i2 = text.indexOf('- ');
    return (i1 > 0) && ((i2 < 0) || ((i2 > 0) && (i2 > i1)));
  }
}
