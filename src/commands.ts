/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
// @ts-nocheck
import * as vscode from "vscode";
import {
  find,
  findNodeAtOffset,
  joinJsonPointer,
  simpleClone,
} from "@xliic/preserving-json-yaml-parser";
import * as snippets from "./generated/snippets.json";
import { Cache } from "./cache";
import { Fix, FixContext, FixType, OpenApiVersion } from "./types";
import { findJsonNodeValue } from "./json-utils";
import { fixInsert } from "./audit/quickfix";
import { getPointerLastSegment, getPointerParent } from "./pointer";
import { processSnippetParameters } from "./util";
import { Node, outlines } from "./outline";

const commands: { [key: string]: Function } = {
  goToLine,
  copyJsonReference,
  createNewTwo,
  createNewThree,
  createNewTwoYaml,
  createNewThreeYaml,

  addPath,
  addOperation,
  addSecurity,
  addHost,
  addBasePath,
  addInfo,
  addSecurityDefinitionBasic,
  addSecurityDefinitionApiKey,
  addSecurityDefinitionOauth2Access,
  addDefinitionObject,
  addParameterBody,
  addParameterPath,
  addParameterOther,
  addResponse,

  v3addInfo,
  v3addComponentsResponse,
  v3addComponentsParameter,
  v3addComponentsSchema,
  v3addServer,
  v3addSecuritySchemeBasic,
  v3addSecuritySchemeApiKey,
  v3addSecuritySchemeJWT,
  v3addSecuritySchemeOauth2Access,

  copySelectedTwoPathOutlineJsonReference,
  copySelectedTwoParametersOutlineJsonReference,
  copySelectedTwoResponsesOutlineJsonReference,
  copySelectedTwoDefinitionOutlineJsonReference,
  copySelectedTwoSecurityOutlineJsonReference,
  copySelectedTwoSecurityDefinitionOutlineJsonReference,
  copySelectedThreePathOutlineJsonReference,
  copySelectedThreeServersOutlineJsonReference,
  copySelectedThreeComponentsOutlineJsonReference,
  copySelectedThreeSecurityOutlineJsonReference,
};

export const registeredSnippetQuickFixes: { [key: string]: Fix } = {};

export function registerCommands(cache: Cache): vscode.Disposable[] {
  for (const fix of snippets.fixes) {
    registeredSnippetQuickFixes[fix.problem[0]] = fix as Fix;
  }
  return Object.keys(commands).map((name) => registerCommand(name, cache, commands[name]));
}

function registerCommand(name: string, cache: Cache, handler: Function): vscode.Disposable {
  const wrapped = async function (...args: any[]) {
    try {
      await handler(cache, ...args);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Failed to execute command: ${e.message}`);
    }
  };

  return vscode.commands.registerCommand(`openapi.${name}`, wrapped);
}

function goToLine(cache: Cache, uri: string | null, range: vscode.Range) {
  const [editor] =
    uri === null
      ? [vscode.window.activeTextEditor]
      : vscode.window.visibleTextEditors.filter((editor) => editor.document.uri.toString() === uri);
  if (editor) {
    editor.selection = new vscode.Selection(range.start, range.start);
    editor.revealRange(editor.selection, vscode.TextEditorRevealType.AtTop);
  }
}

async function copyJsonReference(cache: Cache, range: vscode.Range) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const root = cache.getParsedDocument(editor.document);
    if (root) {
      const [node, path] = findNodeAtOffset(
        root,
        editor.document.offsetAt(editor.selection.active)
      );
      const jsonPointer = joinJsonPointer(path);
      vscode.env.clipboard.writeText(`#${jsonPointer}`);
      const disposable = vscode.window.setStatusBarMessage(`Copied Reference: #${jsonPointer}`);
      setTimeout(() => disposable.dispose(), 1000);
    }
  }
}

function copySelectedTwoPathOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedTwoParametersOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedTwoResponsesOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedTwoDefinitionOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedTwoSecurityOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedTwoSecurityDefinitionOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedThreePathOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedThreeServersOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedThreeComponentsOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedThreeSecurityOutlineJsonReference(cache: Cache, ...args) {
  copySelectedJsonReference(args[0]);
}

function copySelectedJsonReference(node: OutlineNode) {
  copyNodeJsonReference(node);
}

function copyNodeJsonReference(node: OutlineNode) {
  if (node) {
    const encoded = node.id;
    vscode.env.clipboard.writeText(`#${encoded}`);
    const disposable = vscode.window.setStatusBarMessage(`Copied Reference: #${encoded}`);
    setTimeout(() => disposable.dispose(), 1000);
  }
}

async function createNew(snippet: string, language: string) {
  const document = await vscode.workspace.openTextDocument({
    language,
  });
  await vscode.window.showTextDocument(document);
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    await editor.insertSnippet(new vscode.SnippetString(snippet), editor.document.positionAt(0));
  }
}

async function createNewTwo(cache: Cache) {
  await createNew(
    `{
    "swagger":"2.0",
    "info": {
      "title":"\${1:API Title\}",
      "version":"\${2:1.0}"
    },
    "host": "\${3:api.server.test}",
    "basePath": "/",
    "schemes": ["https"],
    "paths": {
    }
  }`,
    "json"
  );
}

async function createNewThree(cache: Cache) {
  await createNew(
    `{
    "openapi":"3.0.2",
    "info": {
      "title":"\${1:API Title}",
      "version":"\${2:1.0}"
    },
    "servers": [
      {"url":"\${3:https://api.server.test/v1}"}
    ],
    "paths": {
    }
  }`,
    "json"
  );
}

async function createNewTwoYaml(cache: Cache) {
  await createNew(
    `swagger: '2.0'
info:
  title: \${1:API Title}
  version: \${2:'1.0'}
host: \${3:api.server.test}
basePath: /
schemes:
  - https
paths:
  /test:
    get:
      responses:
        '200':
          description: OK`,
    "yaml"
  );
}

async function createNewThreeYaml(cache: Cache) {
  await createNew(
    `openapi: '3.0.2'
info:
  title: \${1:API Title}
  version: \${2:'1.0'}
servers:
  - url: \${3:https://api.server.test/v1}
paths:
  /test:
    get:
      responses:
        '200':
          description: OK
`,
    "yaml"
  );
}

async function addBasePath(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["basePath"], cache);
}

async function addHost(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["host"], cache);
}

async function addInfo(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["info"], cache);
}

async function v3addInfo(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["info"], cache);
}

async function addPath(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["path"], cache);
}

async function addSecurityDefinitionBasic(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["securityBasic"], cache);
}

async function addSecurityDefinitionOauth2Access(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["securityOauth2Access"], cache);
}

async function addSecurityDefinitionApiKey(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["securityApiKey"], cache);
}

async function addSecurity(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["security"], cache);
}

async function addDefinitionObject(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["definitionObject"], cache);
}

async function addParameterPath(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["parameterPath"], cache);
}

async function addParameterBody(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["parameterBody"], cache);
}

async function addParameterOther(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["parameterOther"], cache);
}

async function addResponse(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["response"], cache);
}

async function v3addComponentsResponse(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["componentsResponse"], cache);
}

async function v3addComponentsParameter(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["componentsParameter"], cache);
}

async function v3addComponentsSchema(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSchema"], cache);
}

async function v3addSecuritySchemeBasic(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSecurityBasic"], cache);
}

async function v3addSecuritySchemeApiKey(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSecurityApiKey"], cache);
}

async function v3addSecuritySchemeJWT(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSecurityJwt"], cache);
}

async function v3addSecuritySchemeOauth2Access(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSecurityOauth2Access"], cache);
}

async function v3addServer(cache: Cache) {
  await snippetCommand(registeredSnippetQuickFixes["server"], cache);
}

async function addOperation(cache: Cache, node: any) {
  const fix = registeredSnippetQuickFixes["operation"];
  fix.pointer = node.id;
  await snippetCommand(fix, cache);
}

function noActiveOpenApiEditorGuard(cache: Cache) {
  const document = vscode.window.activeTextEditor?.document;
  if (!document || cache.getDocumentVersion(document) === OpenApiVersion.Unknown) {
    vscode.window.showErrorMessage(`Can't run the command, no active editor with OpenAPI file`);
    return true;
  }
  return false;
}

export async function snippetCommand(fix: Fix, cache: Cache, useEdit?: boolean) {
  const editor = vscode.window.activeTextEditor;

  if (noActiveOpenApiEditorGuard(cache) || !editor) {
    return;
  }

  const document = editor.document;
  const root = cache.getLastGoodParsedDocument(document);

  if (!root) {
    // FIXME display error message?
    return;
  }

  const bundle = await cache.getDocumentBundle(document);
  const version = cache.getDocumentVersion(document);
  const target = findJsonNodeValue(root, fix.pointer!);

  const context: FixContext = {
    editor: editor,
    edit: null,
    issues: [],
    fix: simpleClone(fix),
    bulk: false,
    auditContext: null,
    version: version,
    bundle: bundle,
    root: root,
    target: target,
    document: document,
  };

  if (useEdit === true) {
    context.bulk = true;
    context.skipConfirmation = true;
  }

  let finalFix = context.fix["fix"];
  let pointer = context.fix.pointer;
  let pointerPrefix = "";
  while (find(root, pointer) === undefined) {
    const key = getPointerLastSegment(pointer);
    pointer = getPointerParent(pointer);
    const tmpFix = {};
    if (isArray(key)) {
      tmpFix[key] = [finalFix];
      pointerPrefix = "/" + key + "/0" + pointerPrefix;
    } else {
      tmpFix[key] = finalFix;
      pointerPrefix = "/" + key + pointerPrefix;
    }
    finalFix = tmpFix as Fix;
  }

  context.fix["fix"] = finalFix;
  context.target = findJsonNodeValue(root, pointer);

  if (pointerPrefix.length > 0) {
    for (const parameter of context.fix.parameters) {
      parameter.path = pointerPrefix + parameter.path;
    }
  }

  switch (fix.type) {
    case FixType.Insert:
      fixInsert(context);
  }

  if (useEdit) {
    await vscode.workspace.applyEdit(context.edit);
  } else {
    const snippetParameters = context.snippetParameters;
    if (snippetParameters) {
      await processSnippetParameters(editor, snippetParameters, context.dropBrackets);
      await editor.insertSnippet(snippetParameters.snippet, snippetParameters.location);
    }
  }
}

function isArray(key: string): boolean {
  return key === "security" || key === "servers";
}
