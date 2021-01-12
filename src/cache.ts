/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { CacheEntry } from "./types";
import { OpenApiVersion } from "./types";
import { parseToAst, parseToObject } from "./parsers";
import { ParserOptions } from "./parser-options";
import { bundle, findMapping, displayBundlerErrors } from "./bundler";

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
      const entry = await this.updateCacheAsync(event.document);
      this._didChange.fire(entry);
      this._didActiveDocumentChange.fire(entry);
    }
  }

  // TODO track on close events and clear non-json documents

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    // TODO don't re-parse if we've got up-to-date contents in the cache
    if (editor) {
      const entry = await this.updateCacheAsync(editor.document);
      this._didChange.fire(entry);
      this._didActiveDocumentChange.fire(entry);
    }
  }

  async getEntryForDocument(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();
    if (this.cache[uri]) {
      return this.cache[uri];
    }

    const entry = this.updateCacheSync(document);
    await this.updateCacheSync(document);
    return entry;
  }

  getEntryForDocumentSync(document: vscode.TextDocument): CacheEntry {
    const uri = document.uri.toString();
    if (this.cache[uri]) {
      return this.cache[uri];
    }
    return this.updateCacheSync(document);
  }

  private updateCacheSync(document: vscode.TextDocument): CacheEntry {
    const entry = this.getOrCreateEntry(document.uri);

    const [version, node, errors] = parseToAst(document, this.parserOptions);
    entry.version = version;
    entry.astRoot = node;
    entry.errors = errors;

    if (!errors) {
      entry.lastGoodAstRoot = node;
      entry.parsed = parseToObject(document, this.parserOptions);
    } else {
      entry.parsed = null;
    }

    return entry;
  }

  private async updateCacheAsync(document: vscode.TextDocument): Promise<CacheEntry> {
    const entry = this.updateCacheSync(document);

    if (!entry.errors) {
      const [bundled, mapping] = await bundle(document, this);
      entry.bundled = bundled;
      entry.bundledMapping = mapping;
    } else {
      entry.bundled = null;
      entry.bundledUris = null;
      entry.bundledMapping = null;
    }
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
      bundled: null,
      bundledErorrs: null,
      bundledUris: null,
      bundledMapping: null,
    };

    this.cache[_uri] = entry;
    return entry;
  }
}
