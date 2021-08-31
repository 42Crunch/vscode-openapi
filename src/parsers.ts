import * as vscode from "vscode";
import * as yaml from "js-yaml";
import * as json from "jsonc-parser";
import { parse, Node } from "@xliic/openapi-ast-node";
import { ParserOptions } from "./parser-options";
import { OpenApiVersion } from "./types";

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
  const messages = errors.map((error): vscode.Diagnostic => {
    const start = document.positionAt(error.offset);
    const end = error.length ? document.positionAt(error.offset + error.length) : undefined;
    const range = end ? new vscode.Range(start, end) : document.lineAt(start).range;
    return {
      source: "vscode-openapi",
      code: "",
      severity: vscode.DiagnosticSeverity.Error,
      message: error.message,
      range,
    };
  });

  return [version, node, messages.length > 0 ? messages : null];
}

export function getOpenApiVersion(root: Node): OpenApiVersion {
  if (!root) {
    return OpenApiVersion.Unknown;
  }

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
