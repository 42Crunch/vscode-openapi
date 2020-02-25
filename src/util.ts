import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { OpenApiVersion } from './constants';
import { parse, Node } from './ast';
import { parserOptions } from './parser-options';

export function parseDocument(document: vscode.TextDocument): [OpenApiVersion, Node, vscode.Diagnostic[]] {
  const scheme = document.uri.scheme;
  const languageId = document.languageId;
  const supported = (scheme === 'file' || scheme === 'untitled') && (languageId === 'json' || languageId == 'yaml');
  if (!supported) {
    return [OpenApiVersion.Unknown, null, null];
  }

  const [node, errors] = parse(document.getText(), document.languageId, parserOptions);
  const version = getOpenApiVersion(node);
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

  return [version, node, messages.length > 0 ? messages : null];
}

export function getOpenApiVersion(root: Node): OpenApiVersion {
  const swaggerVersionValue = root?.find('/swagger')?.getValue();
  const openApiVersionValue = root?.find('/openapi')?.getValue();

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

export async function provideYamlSchemas(context: vscode.ExtensionContext, yamlExtension: vscode.Extension<any>) {
  if (!yamlExtension.isActive) {
    await yamlExtension.activate();
  }

  function requestSchema(uri: string) {
    for (const document of vscode.workspace.textDocuments) {
      if (document.uri.toString() === uri) {
        const [node] = parse(document.getText(), 'yaml', parserOptions);
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
