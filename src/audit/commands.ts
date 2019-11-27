/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';

import { audit, requestToken } from './client';
import { decorationType, createDecoration } from './decoration';
import { ReportWebView } from './report';
import { DiagnosticCollection, TextDocument } from 'vscode';

import { parseJson, parseYaml } from '../ast';
import * as yaml from 'js-yaml';

export function registerSecurityAudit(context, auditContext, diagnostics: DiagnosticCollection) {
  return vscode.commands.registerTextEditorCommand('openapi.securityAudit', (textEditor, edit) =>
    securityAudit(context, textEditor, auditContext, diagnostics),
  );
}

export function registerFocusSecurityAudit(context, auditContext) {
  return vscode.commands.registerCommand('openapi.focusSecurityAudit', documentUri => {
    const report = auditContext[documentUri];
    if (report) {
      ReportWebView.createOrShow(context.extensionPath, report.issues, report.summary, documentUri);
    }
  });
}

export function registerFocusSecurityAuditById(context, auditContext) {
  return vscode.commands.registerTextEditorCommand('openapi.focusSecurityAuditById', (textEditor, edit, ...ids) => {
    const documentUri = textEditor.document.uri.toString();
    if (auditContext[documentUri]) {
      const issues = ids.map(id => auditContext[documentUri].issues[id]);
      ReportWebView.createOrShow(context.extensionPath, issues, null, documentUri);
    }
  });
}

async function securityAudit(context, textEditor: vscode.TextEditor, auditContext, diagnostics: DiagnosticCollection) {
  let text = textEditor.document.getText();
  const documentUri = textEditor.document.uri.toString();
  const configuration = vscode.workspace.getConfiguration('openapi');
  let apiToken = <string>configuration.get('securityAuditToken');

  if (!apiToken) {
    const email = await vscode.window.showInputBox({
      prompt:
        'Security Audit from 42Crunch runs ~200 checks for security best practices in your API. VS Code needs an API key to use the service. Enter your email to receive the token.',
      placeHolder: 'email address',
      validateInput: value =>
        value.indexOf('@') > 0 && value.indexOf('@') < value.length - 1 ? null : 'Please enter valid email address',
    });

    if (!email) {
      return;
    }

    const tokenRequestResult = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Requesting token' },
      async (progress, token) => {
        try {
          return await requestToken(email);
        } catch (e) {
          vscode.window.showErrorMessage('Unexpected error when trying to request token: ' + e);
        }
      },
    );

    if (!tokenRequestResult || tokenRequestResult.status !== 'success') {
      return;
    }

    const token = await vscode.window.showInputBox({
      prompt:
        "API token has been sent. If you don't get the mail within a couple minutes, check your spam folder and that the address is correct. Paste the token above.",
      ignoreFocusOut: true,
      placeHolder: 'token',
    });

    if (!token) {
      return;
    }

    const configuration = vscode.workspace.getConfiguration();
    configuration.update('openapi.securityAuditToken', token, vscode.ConfigurationTarget.Global);

    apiToken = token;
  }

  if (auditContext[documentUri] && auditContext[documentUri].pending) {
    vscode.window.showErrorMessage(`Audit for "${documentUri}" is already in progress`);
    return;
  }

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Running API Contract Security Audit...',
      cancellable: false,
    },
    async (progress, cancellationToken) => {
      diagnostics.delete(textEditor.document.uri);
      auditContext[documentUri] = { pending: true };
      try {
        const [summary, issues] = await auditDocument(textEditor.document, apiToken, progress, cancellationToken);
        updateDiagnostics(diagnostics, textEditor.document, issues);
        const decorationOptions = createDecoration(issues);
        auditContext[documentUri] = { summary, issues, decorationOptions };
        textEditor.setDecorations(decorationType, decorationOptions);
        ReportWebView.createOrShow(context.extensionPath, issues, summary, documentUri);
      } catch (e) {
        delete auditContext[documentUri];
        if (e.statusCode && e.statusCode === 429) {
          vscode.window.showErrorMessage(
            'Too many requests. You can run up to 3 security audits per minute, please try again later.',
          );
        } else if (e.statusCode && e.statusCode === 403) {
          vscode.window.showErrorMessage(
            'Authentication failed. Please check if you have correct token in Settings > Extensions > OpenAPI. If necessary, remove existing token and request an new one.',
          );
        } else {
          vscode.window.showErrorMessage('Unexpected error when trying to audit API: ' + e);
        }
      }
    },
  );
}

async function auditDocument(document: TextDocument, apiToken, progress, cancellationToken) {
  if (document.languageId === 'json') {
    return await auditJson(document, apiToken, progress, cancellationToken);
  } else if (document.languageId === 'yaml') {
    return await auditYaml(document, apiToken, progress, cancellationToken);
  }
}

async function auditJson(document: TextDocument, apiToken, progress, cancellationToken) {
  const text = document.getText();
  const [root, errors] = parseJson(text);
  if (errors.length > 0) {
    throw new Error('Unable to parse JSON');
  }

  const [summary, issues] = await audit(text, apiToken.trim(), progress, cancellationToken);

  const openApiMarkerNode = root.find('/openapi');
  const swaggerMarkerNode = root.find('/swagger');
  const markerNode = openApiMarkerNode || swaggerMarkerNode;

  for (const issue of issues) {
    const node = issue.pointer === '' ? markerNode : root.find(issue.pointer);
    if (node) {
      const [start, end] = node.getRange();
      const position = document.positionAt(start);
      const line = document.lineAt(position.line);
      issue.lineNo = position.line;
      issue.loc = `Line ${position.line + 1}`;
      issue.range = new vscode.Range(
        new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
        new vscode.Position(position.line, line.range.end.character),
      );
    } else {
      throw new Error(`Unable to locate node: ${issue.pointer}`);
    }
  }

  return [summary, issues];
}

async function auditYaml(document: TextDocument, apiToken, progress, cancellationToken) {
  const text = document.getText();

  const [root, errors] = parseYaml(text);
  if (errors.length > 0) {
    throw new Error('Unable to parse YAML');
  }

  const parsed = yaml.safeLoad(text);
  const [summary, issues] = await audit(JSON.stringify(parsed), apiToken.trim(), progress, cancellationToken);

  const openApiMarkerNode = root.find('/openapi');
  const swaggerMarkerNode = root.find('/swagger');
  const markerNode = openApiMarkerNode || swaggerMarkerNode;

  for (const issue of issues) {
    const node = issue.pointer === '' ? markerNode : root.find(issue.pointer);
    if (node) {
      const [start, end] = node.getRange();
      const position = document.positionAt(start);
      const line = document.lineAt(position.line);
      issue.lineNo = position.line;
      issue.loc = `Line ${position.line + 1}`;
      issue.range = new vscode.Range(
        new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
        new vscode.Position(position.line, line.range.end.character),
      );
    } else {
      throw new Error(`Unable to locate node: ${issue.pointer}`);
    }
  }

  return [summary, issues];
}

function updateDiagnostics(diagnostics: DiagnosticCollection, document: TextDocument, issues) {
  const criticalityToSeverity = {
    1: vscode.DiagnosticSeverity.Hint,
    2: vscode.DiagnosticSeverity.Information,
    3: vscode.DiagnosticSeverity.Warning,
    4: vscode.DiagnosticSeverity.Error,
    5: vscode.DiagnosticSeverity.Error,
  };

  const messages = issues.map(issue => ({
    code: '',
    message: `${issue.description} ${issue.displayScore !== '0' ? `(score impact ${issue.displayScore})` : ''}`,
    severity: criticalityToSeverity[issue.criticality],
    range: issue.range,
  }));

  diagnostics.set(document.uri, messages);
}
