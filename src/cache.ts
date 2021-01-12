/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { CacheEntry } from "./types";
import { OpenApiVersion } from "./types";
import { parseToAst, parseToObject } from "./parsers";
import { ParserOptions } from "./parser-options";

export class Cache {
  private cache: { [uri: string]: CacheEntry } = {};
  private parserOptions: ParserOptions;
  private _didChange = new vscode.EventEmitter<CacheEntry>();
  private _didActiveDocumentChange = new vscode.EventEmitter<CacheEntry>();

  constructor(parserOptions: ParserOptions) {
    this.parserOptions = parserOptions;
  }

  get onDidChange(): vscode.Event<CacheEntry> {
    return this._didChange.event;
  }

  get onDidActiveDocumentChange(): vscode.Event<CacheEntry> {
    return this._didActiveDocumentChange.event;
  }

  async onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
    const activeEditor = vscode.window.activeTextEditor;
    // check change events for the active editor only
    // triggers both events, in future we might update cache
    // not only for the currently active editor, in this case
    // _didChange and _didActiveDocumentChange might fire at a different
    // times
    if (activeEditor && activeEditor.document.uri.toString() === event.document.uri.toString()) {
      const entry = this.updateCache(event.document);
      this._didChange.fire(entry);
      this._didActiveDocumentChange.fire(entry);
    }
  }

  // TODO track on close events and clear non-json documents

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    // TODO don't re-parse if we've got up-to-date contents in the cache
    if (editor) {
      const entry = this.updateCache(editor.document);
      this._didChange.fire(entry);
      this._didActiveDocumentChange.fire(entry);
    }
  }

  getEntryForDocument(document: vscode.TextDocument): CacheEntry {
    const uri = document.uri.toString();
    if (this.cache[uri]) {
      return this.cache[uri];
    }
    return this.updateCache(document);
  }

  private updateCache(document: vscode.TextDocument): CacheEntry {
    const entry = this.getOrCreateEntry(document.uri);

    const [version, node, errors] = parseToAst(document, this.parserOptions);
    entry.version = version;
    entry.astRoot = node;
    entry.errors = errors;
    if (!errors) {
      entry.lastGoodAstRoot = node;
    }

    // FIXME error handling
    entry.parsed = parseToObject(document, this.parserOptions);

    return entry;
  }

  private getOrCreateEntry(uri: vscode.Uri): CacheEntry {
    const _uri = uri.toString();
    if (this.cache[_uri]) {
      return this.cache[_uri];
    }

    const entry = {
      uri,
      version: OpenApiVersion.Unknown,
      astRoot: null,
      lastGoodAstRoot: null,
      parsed: null,
      errors: null,
    };

    this.cache[_uri] = entry;
    return entry;
  }
}
