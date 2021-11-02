import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Cache } from "./cache";
import { OpenApiVersion } from "./types";

export function activate(context: vscode.ExtensionContext, cache: Cache) {
  const yamlExtension = vscode.extensions.getExtension("redhat.vscode-yaml");
  provideYamlSchemas(context, cache, yamlExtension);
}

export async function provideYamlSchemas(
  context: vscode.ExtensionContext,
  cache: Cache,
  yamlExtension: vscode.Extension<any>
) {
  if (!yamlExtension.isActive) {
    await yamlExtension.activate();
  }

  function requestSchema(uri: string) {
    for (const document of vscode.workspace.textDocuments) {
      if (document.uri.toString() === uri) {
        const version = cache.getDocumentVersion(document);
        if (version === OpenApiVersion.V2) {
          return "openapi:v2";
        } else if (version === OpenApiVersion.V3) {
          return "openapi:v3";
        }
        break;
      }
    }
    return null;
  }

  function requestSchemaContent(uri: string) {
    if (uri === "openapi:v2") {
      const filename = path.join(context.extensionPath, "schema/generated", "openapi-2.0.json");
      return fs.readFileSync(filename, { encoding: "utf8" });
    } else if (uri === "openapi:v3") {
      const filename = path.join(
        context.extensionPath,
        "schema/generated",
        "openapi-3.0-2019-04-02.json"
      );
      return fs.readFileSync(filename, { encoding: "utf8" });
    }
    return null;
  }

  const schemaContributor = yamlExtension.exports;
  schemaContributor.registerContributor("openapi", requestSchema, requestSchemaContent);
}
