import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Cache } from "./cache";
import { OpenApiVersion } from "./types";
import { Configuration } from "./configuration";

type SchemaId = "openapi:v2" | "openapi:v3" | "openapi:v3_1_2020" | "openapi:v3_1_unknown";

export function activate(
  context: vscode.ExtensionContext,
  cache: Cache,
  configuration: Configuration
) {
  const yamlExtension = vscode.extensions.getExtension("redhat.vscode-yaml");
  if (yamlExtension) {
    provideYamlSchemas(context, cache, configuration, yamlExtension);
  } else {
    // TODO log
  }
}

export async function provideYamlSchemas(
  context: vscode.ExtensionContext,
  cache: Cache,
  configuration: Configuration,
  yamlExtension: vscode.Extension<any>
) {
  if (!yamlExtension.isActive) {
    await yamlExtension.activate();
  }

  let disabled = configuration.get("advanced.disableYamlSchemaContribution");
  configuration.onDidChange((e: vscode.ConfigurationChangeEvent) => {
    if (configuration.changed(e, "advanced.disableYamlSchemaContribution")) {
      disabled = configuration.get("advanced.disableYamlSchemaContribution");
    }
  });

  function requestSchema(uri: string): SchemaId | null {
    if (disabled) {
      return null;
    }

    for (const document of vscode.workspace.textDocuments) {
      if (document.uri.toString() === uri) {
        const version = cache.getDocumentVersion(document);
        if (version === OpenApiVersion.V2) {
          return "openapi:v2";
        } else if (version === OpenApiVersion.V3) {
          return "openapi:v3";
        } else if (version === OpenApiVersion.V3_1) {
          const parsed = cache.getParsedDocument(document);
          if (
            parsed &&
            ((parsed as any)?.jsonSchemaDialect === undefined ||
              (parsed as any)?.jsonSchemaDialect ===
                "https://spec.openapis.org/oas/3.1/dialect/base")
          ) {
            return "openapi:v3_1_2020";
          } else {
            return "openapi:v3_1_unknown";
          }
        }
        break;
      }
    }

    return null;
  }

  function requestSchemaContent(uri: string) {
    const schemas: Record<SchemaId, string> = {
      "openapi:v2": "openapi-2.0.json",
      "openapi:v3": "openapi-3.0-2019-04-02.json",
      "openapi:v3_1_2020": "openapi-3.1-draft07-2020.json",
      "openapi:v3_1_unknown": "openapi-3.1-draft07-unknown.json",
    };

    if (!disabled && schemas[uri as SchemaId] !== undefined) {
      const filename = path.join(
        context.extensionPath,
        "schema/generated",
        schemas[uri as SchemaId]
      );
      return fs.readFileSync(filename, { encoding: "utf8" });
    }

    return null;
  }

  const schemaContributor = yamlExtension.exports;
  schemaContributor.registerContributor("openapi", requestSchema, requestSchemaContent);
}
