import * as vscode from "vscode";
import { parse } from "@xliic/preserving-json-yaml-parser";
import { ParserOptions } from "./parser-options";
import { OpenApiVersion } from "./types";

export function parseToAst(
  document: vscode.TextDocument,
  parserOptions: ParserOptions
): [OpenApiVersion, any, vscode.Diagnostic[]] {
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

export function getOpenApiVersion(root: any): OpenApiVersion {
  if (root?.swagger === "2.0") {
    return OpenApiVersion.V2;
  } else if (
    root?.openapi &&
    typeof root?.openapi === "string" &&
    root?.openapi?.match(/^3\.0\.\d(-.+)?$/)
  ) {
    return OpenApiVersion.V3;
  } else {
    return OpenApiVersion.Unknown;
  }
}
