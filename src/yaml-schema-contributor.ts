import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Cache } from "./cache";
import { OpenApiVersion } from "./types";
import { Configuration } from "./configuration";

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

  function requestSchema(uri: string) {
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
        }
        break;
      }
    }

    return null;
  }

  function requestSchemaContent(uri: string) {
    if (!disabled && uri === "openapi:v2") {
      const filename = path.join(context.extensionPath, "schema/generated", "openapi-2.0.json");
      return fs.readFileSync(filename, { encoding: "utf8" });
    } else if (!disabled && uri === "openapi:v3") {
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
