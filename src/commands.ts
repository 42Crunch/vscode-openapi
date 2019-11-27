/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import { parse, Node, JsonNode, YamlNode } from './ast';
import * as snippets from './snippets.json';

const commands = {
  goToLine,
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
  addSecurityDefinitionOauth2Implicit,
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
  v3addSecuritySchemeOauth2Implicit,
};

// preferred order of the tags, mixed v2 and v3 tags
const topTags: string[] = [
  'swagger',
  'openapi',
  'info',
  'externalDocs',
  'host',
  'basePath',
  'schemes',
  'consumes',
  'produces',
  'tags',
  'servers',
  'components',
  'paths',
  'parameters',
  'responses',
  'security',
  'securityDefinitions',
  'definitions',
];

// preferred order of tags in v3 components
const componentsTags: string[] = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'requestBodies',
  'headers',
  'securitySchemes',
  'links',
  'callbacks',
];

export function registerCommands(): vscode.Disposable[] {
  return Object.keys(commands).map(name => registerCommand(name, commands[name]));
}

function registerCommand(name: string, handler: Function): vscode.Disposable {
  const wrapped = async function(...args: any[]) {
    try {
      await handler(...args);
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to execute command: ${e.message}`);
    }
  };

  return vscode.commands.registerCommand(`openapi.${name}`, wrapped);
}

function goToLine(range: vscode.Range) {
  const editor = vscode.window.activeTextEditor;
  editor.selection = new vscode.Selection(range.start, range.start);
  editor.revealRange(editor.selection, vscode.TextEditorRevealType.AtTop);
}

async function createNew(snippet: string, language: string) {
  const document = await vscode.workspace.openTextDocument({
    language,
  });
  await vscode.window.showTextDocument(document);
  const editor = vscode.window.activeTextEditor;
  await editor.insertSnippet(new vscode.SnippetString(snippet), editor.document.positionAt(0));
}

async function createNewTwo() {
  await createNew(snippets.newVersionTwo, 'json');
}

async function createNewThree() {
  await createNew(snippets.newVersionThree, 'json');
}

async function createNewTwoYaml() {
  await createNew(snippets.newVersionTwoYaml, 'yaml');
}

async function createNewThreeYaml() {
  await createNew(snippets.newVersionThreeYaml, 'yaml');
}

async function addBasePath() {
  await insertSnippetAfter('basePath', '/swagger');
}

async function addHost() {
  await insertSnippetAfter('host', '/swagger');
}

async function addInfo() {
  await insertSnippetAfter('info', '/swagger');
}

async function v3addInfo() {
  await insertSnippetAfter('info', '/openapi');
}

async function addPath() {
  await insertSnippetIntoRoot('path', 'paths');
}

async function addSecurityDefinitionBasic() {
  await insertSnippetIntoRoot('securityBasic', 'securityDefinitions');
}

async function addSecurityDefinitionOauth2Implicit() {
  await insertSnippetIntoRoot('securityOauth2Implicit', 'securityDefinitions');
}

async function addSecurityDefinitionApiKey() {
  await insertSnippetIntoRoot('securityApiKey', 'securityDefinitions');
}

async function addSecurity() {
  await insertSnippetIntoRoot('security', 'security', 'array');
}

async function addDefinitionObject() {
  await insertSnippetIntoRoot('definitionObject', 'definitions');
}

async function addParameterPath() {
  await insertSnippetIntoRoot('parameterPath', 'parameters');
}

async function addParameterBody() {
  await insertSnippetIntoRoot('parameterBody', 'parameters');
}

async function addParameterOther() {
  await insertSnippetIntoRoot('parameterOther', 'parameters');
}

async function addResponse() {
  await insertSnippetIntoRoot('response', 'responses');
}

async function v3addComponentsResponse() {
  await insertSnippetIntoComponents('componentsResponse', 'responses');
}

async function v3addComponentsParameter() {
  await insertSnippetIntoComponents('componentsParameter', 'parameters');
}

async function v3addComponentsSchema() {
  await insertSnippetIntoComponents('componentsSchema', 'schemas');
}

async function v3addSecuritySchemeBasic() {
  await insertSnippetIntoComponents('componentsSecurityBasic', 'securitySchemes');
}

async function v3addSecuritySchemeApiKey() {
  await insertSnippetIntoComponents('componentsSecurityApiKey', 'securitySchemes');
}

async function v3addSecuritySchemeJWT() {
  await insertSnippetIntoComponents('componentsSecurityJwt', 'securitySchemes');
}

async function v3addSecuritySchemeOauth2Implicit() {
  await insertSnippetIntoComponents('componentsSecurityOauth2Implicit', 'securitySchemes');
}

async function v3addServer() {
  await insertSnippetIntoRoot('server', 'servers', 'array');
}

async function addOperation(node: any) {
  const editor = vscode.window.activeTextEditor;
  const languageId = editor.document.languageId;
  if (languageId === 'yaml') {
    const target = node.node.value;
    let snippet = snippets.operationYaml;

    const eol = editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    await editor.edit(builder => {
      builder.insert(editor.document.positionAt(target.endPosition), eol);
    });

    await editor.insertSnippet(
      new vscode.SnippetString(`\n${increaseIndent(snippet, 2)}\n`),
      editor.document.positionAt(target.endPosition + eol.length),
    );
  } else {
    const target = node.node.parent.children[1];
    let snippet = snippets.operation;
    snippet = `\n${snippet}`;
    if (target.children.length > 0) {
      // append comma at the end of the snippet
      snippet = `${snippet},`;
    }

    await editor.insertSnippet(new vscode.SnippetString(snippet), editor.document.positionAt(target.offset + 1));
  }
}

async function insertSnippetAfter(snippetName: string, pointer: string) {
  const editor = vscode.window.activeTextEditor;
  const text = editor.document.getText();
  const languageId = editor.document.languageId;
  const root = safeParse(text, languageId);

  if (languageId === 'yaml') {
    let snippet = snippets[`${snippetName}Yaml`];
    await insertYamlSnippetAfter(<YamlNode>root, snippet, pointer);
  } else {
    let snippet = snippets[snippetName];
    await insertJsonSnippetAfter(<JsonNode>root, snippet, pointer);
  }
}

async function insertYamlSnippetAfter(root: YamlNode, snippet: string, pointer: string) {
  const editor = vscode.window.activeTextEditor;
  const node = root.find(pointer);

  const eol = editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  await editor.edit(builder => {
    builder.insert(editor.document.positionAt(node.node.endPosition), eol);
  });

  await editor.insertSnippet(
    new vscode.SnippetString(`${snippet}`),
    editor.document.positionAt(node.node.endPosition + eol.length),
  );
}

async function insertJsonSnippetAfter(root: JsonNode, snippet: string, pointer: string) {
  const editor = vscode.window.activeTextEditor;
  const jnode = root.find(pointer).node;
  const last = jnode.parent.parent.children.indexOf(jnode.parent) == jnode.parent.parent.children.length - 1;
  let insertPosition: number;
  if (last) {
    // inserting snippet after the last node in the object
    snippet = `,\n${snippet}`;
    insertPosition = jnode.offset + jnode.length;
  } else {
    snippet = `\n${snippet},`;
    insertPosition = jnode.offset + jnode.length + 1;
  }
  await editor.insertSnippet(new vscode.SnippetString(snippet), editor.document.positionAt(insertPosition));
}

async function insertYamlSnippetInto(root: YamlNode, snippet: string, pointer: string) {
  const editor = vscode.window.activeTextEditor;
  const ynode = root.find(pointer).node;

  await editor.insertSnippet(
    new vscode.SnippetString(`${snippet}\n`),
    editor.document.positionAt(ynode.value.startPosition),
  );
}

async function insertJsonSnippetInto(root: JsonNode, snippet: string, pointer: string) {
  const editor = vscode.window.activeTextEditor;
  const jnode = root.find(pointer).node;

  snippet = `\n${snippet}`;
  if (jnode.children.length > 0) {
    // append coma at the end of the snippet
    snippet = `${snippet},`;
  }

  await editor.insertSnippet(new vscode.SnippetString(snippet), editor.document.positionAt(jnode.offset + 1));
}

async function insertSnippetIntoRoot(snippetName: string, element: string, container: string = 'object') {
  const editor = vscode.window.activeTextEditor;
  const text = editor.document.getText();
  const languageId = editor.document.languageId;
  const root = safeParse(text, languageId);

  if (languageId === 'yaml') {
    let snippet = snippets[`${snippetName}Yaml`];
    if (root.find(`/${element}`)) {
      await insertYamlSnippetInto(<YamlNode>root, snippet, `/${element}`);
    } else {
      const target = findInsertionAnchor(root, element);
      snippet = `${element}:\n${increaseIndent(snippet)}\n`;
      await insertYamlSnippetAfter(<YamlNode>root, snippet, `/${target}`);
    }
  } else {
    let snippet = snippets[snippetName];
    if (root.find(`/${element}`)) {
      await insertJsonSnippetInto(<JsonNode>root, snippet, `/${element}`);
    } else {
      if (container === 'object') {
        snippet = `"${element}": {\n${snippet}\n}`;
      } else {
        // array container otherwise
        snippet = `"${element}": [\n${snippet}\n]`;
      }
      const target = findInsertionAnchor(root, element);
      await insertJsonSnippetAfter(<JsonNode>root, snippet, `/${target}`);
    }
  }
}

async function insertSnippetIntoComponents(snippetName: string, element: string) {
  const editor = vscode.window.activeTextEditor;
  const text = editor.document.getText();
  const languageId = editor.document.languageId;
  const root = safeParse(text, languageId);

  if (languageId === 'yaml') {
    let snippet = snippets[`${snippetName}Yaml`];
    if (root.find(`/components/${element}`)) {
      await insertYamlSnippetInto(<YamlNode>root, snippet, `/components/${element}`);
    } else if (root.find('/components')) {
      const position = findComponentsInsertionPosition(root, element);
      if (position >= 0) {
        // found where to insert
        snippet = `\n\t${element}:\n${increaseIndent(snippet, 2)}\n`;
        await insertYamlSnippetAfter(<YamlNode>root, snippet, `/components/${componentsTags[position]}`);
      } else {
        // insert into the 'components'
        snippet = `${element}:\n${increaseIndent(snippet, 2)}\n`;
        await insertYamlSnippetInto(<YamlNode>root, snippet, '/components');
      }
    } else {
      snippet = `components:\n\t${element}:\n${increaseIndent(snippet, 2)}\n`;
      const target = findInsertionAnchor(root, 'components');
      await insertYamlSnippetAfter(<YamlNode>root, snippet, `/${target}`);
    }
  } else {
    let snippet = snippets[snippetName];
    if (root.find(`/components/${element}`)) {
      await insertJsonSnippetInto(<JsonNode>root, snippet, `/components/${element}`);
    } else if (root.find('/components')) {
      const position = findComponentsInsertionPosition(root, element);
      if (position >= 0) {
        // found where to insert
        snippet = `"${element}": {\n${snippet}\n}`;
        await insertJsonSnippetAfter(<JsonNode>root, snippet, `/components/${componentsTags[position]}`);
      } else {
        // insert into the 'components'
        snippet = `\t"${element}": {\n\t${snippet}\n\t}`;
        await insertJsonSnippetInto(<JsonNode>root, snippet, '/components');
      }
    } else {
      snippet = `"components": {\n\t"${element}": {\n\t${snippet}\n\t}\n}`;
      const target = findInsertionAnchor(root, 'components');
      await insertJsonSnippetAfter(<JsonNode>root, snippet, `/${target}`);
    }
  }
}

function findInsertionAnchor(root: Node, element: string): string {
  const desiredPosition = topTags.indexOf(element) - 1;
  let position = desiredPosition;
  for (; position >= 0; position--) {
    if (root.find(`/${topTags[position]}`)) {
      break;
    }
  }

  if (position >= 0) {
    return topTags[position];
  }

  return null;
}

function increaseIndent(snippet: string, level = 1) {
  return snippet
    .split('\n')
    .map(line => '\t'.repeat(level) + line)
    .join('\n');
}

function findComponentsInsertionPosition(root: Node, element: string) {
  const desiredPosition = componentsTags.indexOf(element) - 1;
  let position = desiredPosition;
  for (; position >= 0; position--) {
    if (root.find(`/components/${componentsTags[position]}`)) {
      break;
    }
  }
  return position;
}

function safeParse(text: string, languageId: string): Node {
  const [root, errors] = parse(text, languageId);
  if (errors.length) {
    throw new Error("Can't parse OpenAPI file");
  }
  return root;
}
