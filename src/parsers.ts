import * as vscode from "vscode";
import * as yaml from "js-yaml";
import * as json from "jsonc-parser";
import { parse, Node } from "@xliic/openapi-ast-node";
import { ParserOptions } from "./parser-options";
import { OpenApiVersion } from "./types";

export function parseToObject(document: vscode.TextDocument, options: ParserOptions) {
  if (
    !(
      document.languageId === "json" ||
      document.languageId === "jsonc" ||
      document.languageId == "yaml"
    )
  ) {
    return null;
  }

  if (document.languageId === "yaml") {
    // FIXME what's up with parsing errors?
    const {
      yaml: { schema }
    } = options.get();
    return yaml.safeLoad(document.getText(), { schema });
  }

  const errors: json.ParseError[] = [];
  const parsed = json.parse(document.getText(), errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    const message = errors
      .map((error) => `${json.printParseErrorCode(error.error)} at offset ${error.offset}`)
      .join(", ");
    throw new Error(`Failed to parse JSON: ${message}`);
  }
  return parsed;
}

export function parseToAst(
  document: vscode.TextDocument,
  parserOptions: ParserOptions
): [OpenApiVersion, Node, vscode.Diagnostic[]] {
  if (
    !(
      document.languageId === "json" ||
      document.languageId === "jsonc" ||
      document.languageId == "yaml"
    )
  ) {
    return [OpenApiVersion.Unknown, null, null];
  }

  const [node, errors] = parse(document.getText(), document.languageId, parserOptions);
  const version = getOpenApiVersion(node);
  const messages = errors.map(
    (error): vscode.Diagnostic => {
      const position = document.positionAt(error.offset);
      const line = document.lineAt(position);
      return {
        source: "vscode-openapi",
        code: "",
        severity: vscode.DiagnosticSeverity.Error,
        message: error.message,
        range: line.range,
      };
    }
  );

  return [version, node, messages.length > 0 ? messages : null];
}

export function getOpenApiVersion(root: Node): OpenApiVersion {
  const swaggerVersionValue = root?.find("/swagger")?.getValue();
  const openApiVersionValue = root?.find("/openapi")?.getValue();

  if (swaggerVersionValue === "2.0") {
    return OpenApiVersion.V2;
  }

  if (
    openApiVersionValue &&
    typeof openApiVersionValue === "string" &&
    openApiVersionValue.match(/^3\.0\.\d(-.+)?$/)
  ) {
    return OpenApiVersion.V3;
  }

  return OpenApiVersion.Unknown;
}
