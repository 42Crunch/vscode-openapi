/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import { parse, Node } from './ast';
import { Configuration } from './configuration';
import { OpenApiVersion, extensionQualifiedId } from './constants';

import {
  PathOutlineProvider,
  DefinitionOutlineProvider,
  SecurityDefinitionOutlineProvider,
  ParametersOutlineProvider,
  ResponsesOutlineProvider,
  SecurityOutlineProvider,
  ServersOutlineProvider,
  ComponentsOutlineProvider,
  GeneralTwoOutlineProvider,
  GeneralThreeOutlineProvider,
} from './outline';

import { JsonSchemaDefinitionProvider, YamlSchemaDefinitionProvider } from './reference';
import { OpenapiSchemaContentProvider } from './schema';
import { updateContext } from './context';
import { registerCommands } from './commands';
import { create as createWhatsNewPanel } from './whatsnew';

import * as audit from './audit/activate';

function getOpenApiVersion(root: Node): OpenApiVersion {
  const swaggerVersionValue = root.find('/swagger') ? root.find('/swagger').getValue() : null;
  const openApiVersionValue = root.find('/openapi') ? root.find('/openapi').getValue() : null;

  if (swaggerVersionValue === '2.0') {
    return OpenApiVersion.V2;
  } else if (
    openApiVersionValue &&
    typeof openApiVersionValue === 'string' &&
    openApiVersionValue.match(/^3\.0\.\d(-.+)?$/)
  ) {
    return OpenApiVersion.V3;
  }

  return OpenApiVersion.Unknown;
}

function parseDocument(document: vscode.TextDocument): [OpenApiVersion, Node, vscode.Diagnostic[]] {
  const scheme = document.uri.scheme;
  const languageId = document.languageId;
  const supported = (scheme === 'file' || scheme === 'untitled') && (languageId === 'json' || languageId == 'yaml');
  if (!supported) {
    return [OpenApiVersion.Unknown, null, null];
  }

  const [node, errors] = parse(document.getText(), document.languageId);
  if (errors.length > 0) {
    const messages = errors.map(error => {
      const position = document.positionAt(error.offset);
      const line = document.lineAt(position);
      return {
        code: '',
        severity: vscode.DiagnosticSeverity.Error,
        message: error.message,
        range: line.range,
      };
    });
    return [OpenApiVersion.Unknown, null, messages];
  }

  const version = getOpenApiVersion(node);

  return [version, node, null];
}

function updateVersionContext(version: OpenApiVersion) {
  if (version === OpenApiVersion.V2) {
    vscode.commands.executeCommand('setContext', 'openapiTwoEnabled', true);
    vscode.commands.executeCommand('setContext', 'openapiThreeEnabled', false);
  } else if (version === OpenApiVersion.V3) {
    vscode.commands.executeCommand('setContext', 'openapiThreeEnabled', true);
    vscode.commands.executeCommand('setContext', 'openapiTwoEnabled', false);
  } else {
    vscode.commands.executeCommand('setContext', 'openapiTwoEnabled', false);
    vscode.commands.executeCommand('setContext', 'openapiThreeEnabled', false);
  }
}

async function onActiveEditorChanged(
  editor: vscode.TextEditor,
  didChangeTree: vscode.EventEmitter<[Node, vscode.TextDocumentChangeEvent]>,
  didChangeEditor: vscode.EventEmitter<[vscode.TextEditor, OpenApiVersion]>,
  diagnostics: vscode.DiagnosticCollection,
): Promise<void> {
  if (editor) {
    const [version, node, errors] = parseDocument(editor.document);
    // parsing errors when changing documents or encountering unsupported documents
    // should cause version context values to change, clearing the outline
    updateVersionContext(version);
    if (errors) {
      diagnostics.set(editor.document.uri, errors);
      vscode.commands.executeCommand('setContext', 'openapiErrors', true);
    } else {
      diagnostics.delete(editor.document.uri);
      vscode.commands.executeCommand('setContext', 'openapiErrors', false);
      didChangeTree.fire([node, null]);
    }
    didChangeEditor.fire([editor, version]);
  } else {
    didChangeEditor.fire([null, OpenApiVersion.Unknown]);
  }
}

function onDocumentChanged(
  event: vscode.TextDocumentChangeEvent,
  didChangeTree: vscode.EventEmitter<[Node, vscode.TextDocumentChangeEvent]>,
  diagnostics: vscode.DiagnosticCollection,
): void {
  // check change events for the active editor only
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && activeEditor.document.uri.toString() === event.document.uri.toString()) {
    const [version, node, errors] = parseDocument(event.document);
    if (errors) {
      diagnostics.set(event.document.uri, errors);
      vscode.commands.executeCommand('setContext', 'openapiErrors', true);
      // in presense of parsing errors don't update version context values
      // effectively freezing current state of outline
    } else {
      diagnostics.delete(event.document.uri);
      vscode.commands.executeCommand('setContext', 'openapiErrors', false);
      updateVersionContext(version);
      didChangeTree.fire([node, event]);
    }
  }
}

async function provideYamlSchemas(context: vscode.ExtensionContext, yamlExtension: vscode.Extension<any>) {
  if (!yamlExtension.isActive) {
    await yamlExtension.activate();
  }

  function requestSchema(uri: string) {
    for (const document of vscode.workspace.textDocuments) {
      if (document.uri.toString() === uri) {
        const [node] = parse(document.getText(), 'yaml');
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
      const filename = path.join(context.extensionPath, 'schema', 'openapi-3.0-2019-04-02-relaxed-ref.json');
      return fs.readFileSync(filename, { encoding: 'utf8' });
    }
    return null;
  }

  const schemaContributor = yamlExtension.exports;
  schemaContributor.registerContributor('openapi', requestSchema, requestSchemaContent);
}

export function activate(context: vscode.ExtensionContext) {
  const didChangeTree = new vscode.EventEmitter<[Node, vscode.TextDocumentChangeEvent]>();
  const didChangeEditor = new vscode.EventEmitter<[vscode.TextEditor, OpenApiVersion]>();
  const versionProperty = 'openapiVersion';
  const openapiExtension = vscode.extensions.getExtension(extensionQualifiedId);
  const currentVersion = semver.parse(openapiExtension.packageJSON.version);
  const previousVersion = context.globalState.get<string>(versionProperty)
    ? semver.parse(context.globalState.get<string>(versionProperty))
    : semver.parse('0.0.1');
  context.globalState.update(versionProperty, currentVersion.toString());

  // OpenAPI v2 outlines
  vscode.window.registerTreeDataProvider(
    'openapiTwoSpecOutline',
    new GeneralTwoOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoPathOutline',
    new PathOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoDefinitionOutline',
    new DefinitionOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoSecurityOutline',
    new SecurityOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoSecurityDefinitionOutline',
    new SecurityDefinitionOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoParametersOutline',
    new ParametersOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoResponsesOutline',
    new ResponsesOutlineProvider(context, didChangeTree.event),
  );

  // OpenAPI v3 outlines
  vscode.window.registerTreeDataProvider(
    'openapiThreePathOutline',
    new PathOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiThreeSpecOutline',
    new GeneralThreeOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiThreeComponentsOutline',
    new ComponentsOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiThreeSecurityOutline',
    new SecurityOutlineProvider(context, didChangeTree.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiThreeServersOutline',
    new ServersOutlineProvider(context, didChangeTree.event),
  );

  vscode.workspace.registerTextDocumentContentProvider('openapi-schemas', new OpenapiSchemaContentProvider(context));

  updateContext(didChangeTree.event);
  registerCommands();

  const jsonSchemaDefinitionProvider = new JsonSchemaDefinitionProvider();
  const yamlSchemaDefinitionProvider = new YamlSchemaDefinitionProvider();

  vscode.languages.registerDefinitionProvider({ language: 'json', scheme: 'file' }, jsonSchemaDefinitionProvider);
  vscode.languages.registerDefinitionProvider({ language: 'json', scheme: 'untitled' }, jsonSchemaDefinitionProvider);

  vscode.languages.registerDefinitionProvider({ language: 'yaml', scheme: 'file' }, yamlSchemaDefinitionProvider);
  vscode.languages.registerDefinitionProvider({ language: 'yaml', scheme: 'untitled' }, yamlSchemaDefinitionProvider);

  const diagnostics = vscode.languages.createDiagnosticCollection('openapi');

  vscode.workspace.onDidCloseTextDocument(document => {
    diagnostics.delete(document.uri);
  });

  // trigger refresh on activation
  onActiveEditorChanged(vscode.window.activeTextEditor, didChangeTree, didChangeEditor, diagnostics);

  vscode.window.onDidChangeActiveTextEditor(e => onActiveEditorChanged(e, didChangeTree, didChangeEditor, diagnostics));
  vscode.workspace.onDidChangeTextDocument(e => onDocumentChanged(e, didChangeTree, diagnostics));

  const yamlExtension = vscode.extensions.getExtension('redhat.vscode-yaml');
  provideYamlSchemas(context, yamlExtension);

  audit.activate(context, didChangeEditor.event);

  if (previousVersion.major < currentVersion.major) {
    createWhatsNewPanel(context);
  }

  Configuration.configure(context);
}

export function deactivate(): Thenable<void> | undefined {
  return undefined;
}
