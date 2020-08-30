/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import * as semver from 'semver';
import { configuration, Configuration } from './configuration';
import { OpenApiVersion, extensionQualifiedId } from './constants';
import { Node } from './ast';
import { parseDocument, provideYamlSchemas } from './util';
import { parserOptions } from './parser-options';

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
import { CompletionItemProvider } from './completion';
import { updateContext } from './context';
import { registerCommands } from './commands';
import { create as createWhatsNewPanel } from './whatsnew';

import * as audit from './audit/activate';
import * as preview from './preview';

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
  didChangeTreeIncludingErrors: vscode.EventEmitter<[Node, vscode.TextDocumentChangeEvent]>,
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
    didChangeTreeIncludingErrors.fire([node, null]);
    didChangeEditor.fire([editor, version]);
  } else {
    didChangeTree.fire([null, null]);
    didChangeTreeIncludingErrors.fire([null, null]);
    didChangeEditor.fire([null, OpenApiVersion.Unknown]);
  }
}

function onDocumentChanged(
  event: vscode.TextDocumentChangeEvent,
  didChangeTree: vscode.EventEmitter<[Node, vscode.TextDocumentChangeEvent]>,
  didChangeTreeIncludingErrors: vscode.EventEmitter<[Node, vscode.TextDocumentChangeEvent]>,
  diagnostics: vscode.DiagnosticCollection,
): void {
  // check change events for the active editor only
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && activeEditor.document.uri.toString() === event.document.uri.toString()) {
    const [version, node, errors] = parseDocument(event.document);
    didChangeTreeIncludingErrors.fire([node, event]);
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

export function activate(context: vscode.ExtensionContext) {
  const didChangeTreeValid = new vscode.EventEmitter<[Node, vscode.TextDocumentChangeEvent]>();
  const didChangeTreeIncludingErrors = new vscode.EventEmitter<[Node, vscode.TextDocumentChangeEvent]>();
  const didChangeEditor = new vscode.EventEmitter<[vscode.TextEditor, OpenApiVersion]>();
  const versionProperty = 'openapiVersion';
  const openapiExtension = vscode.extensions.getExtension(extensionQualifiedId);
  const currentVersion = semver.parse(openapiExtension.packageJSON.version);
  const previousVersion = context.globalState.get<string>(versionProperty)
    ? semver.parse(context.globalState.get<string>(versionProperty))
    : semver.parse('0.0.1');
  const yamlConfiguration = new Configuration('yaml');
  context.globalState.update(versionProperty, currentVersion.toString());
  parserOptions.configure(yamlConfiguration);

  // OpenAPI v2 outlines
  vscode.window.registerTreeDataProvider(
    'openapiTwoSpecOutline',
    new GeneralTwoOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoPathOutline',
    new PathOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoDefinitionOutline',
    new DefinitionOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoSecurityOutline',
    new SecurityOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoSecurityDefinitionOutline',
    new SecurityDefinitionOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoParametersOutline',
    new ParametersOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiTwoResponsesOutline',
    new ResponsesOutlineProvider(context, didChangeTreeValid.event),
  );

  // OpenAPI v3 outlines
  vscode.window.registerTreeDataProvider(
    'openapiThreePathOutline',
    new PathOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiThreeSpecOutline',
    new GeneralThreeOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiThreeComponentsOutline',
    new ComponentsOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiThreeSecurityOutline',
    new SecurityOutlineProvider(context, didChangeTreeValid.event),
  );

  vscode.window.registerTreeDataProvider(
    'openapiThreeServersOutline',
    new ServersOutlineProvider(context, didChangeTreeValid.event),
  );

  updateContext(didChangeTreeValid.event);
  registerCommands();

  const jsonFile: vscode.DocumentSelector = { language: 'json' };
  const jsoncFile: vscode.DocumentSelector = { language: 'jsonc' };
  const yamlFile: vscode.DocumentSelector = { language: 'yaml' };

  const completionProvider = new CompletionItemProvider(context, didChangeTreeIncludingErrors.event);
  vscode.languages.registerCompletionItemProvider(yamlFile, completionProvider, '"');
  vscode.languages.registerCompletionItemProvider(jsonFile, completionProvider, '"');
  vscode.languages.registerCompletionItemProvider(jsoncFile, completionProvider, '"');

  const jsonSchemaDefinitionProvider = new JsonSchemaDefinitionProvider();
  const yamlSchemaDefinitionProvider = new YamlSchemaDefinitionProvider();

  vscode.languages.registerDefinitionProvider(jsonFile, jsonSchemaDefinitionProvider);
  vscode.languages.registerDefinitionProvider(jsoncFile, jsonSchemaDefinitionProvider);
  vscode.languages.registerDefinitionProvider(yamlFile, yamlSchemaDefinitionProvider);

  const diagnostics = vscode.languages.createDiagnosticCollection('openapi');

  vscode.workspace.onDidCloseTextDocument((document) => {
    diagnostics.delete(document.uri);
  });

  // trigger refresh on activation
  onActiveEditorChanged(
    vscode.window.activeTextEditor,
    didChangeTreeValid,
    didChangeTreeIncludingErrors,
    didChangeEditor,
    diagnostics,
  );

  vscode.window.onDidChangeActiveTextEditor((e) =>
    onActiveEditorChanged(e, didChangeTreeValid, didChangeTreeIncludingErrors, didChangeEditor, diagnostics),
  );

  vscode.workspace.onDidChangeTextDocument((e) =>
    onDocumentChanged(e, didChangeTreeValid, didChangeTreeIncludingErrors, diagnostics),
  );

  const yamlExtension = vscode.extensions.getExtension('redhat.vscode-yaml');
  provideYamlSchemas(context, yamlExtension);

  audit.activate(context, didChangeEditor.event);
  preview.activate(context);

  if (previousVersion.major < currentVersion.major) {
    createWhatsNewPanel(context);
  }

  configuration.configure(context);
  yamlConfiguration.configure(context);
}

export function deactivate(): Thenable<void> | undefined {
  return undefined;
}
