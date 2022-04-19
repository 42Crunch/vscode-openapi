// @ts-nocheck
import * as vscode from "vscode";
import {
  AuditContext,
  AuditDiagnostic,
  DeleteFix,
  FixContext,
  InsertReplaceRenameFix,
  Issue,
  RegexReplaceFix,
  Fix,
  FixType,
  OpenApiVersion,
} from "../types";
import { Cache } from "../cache";
import { generateSchema, generateOneOfSchema } from "./schema";
import { updateReport, fixInsert } from "./quickfix";
import { simpleClone, parse, Parsed, find } from "@xliic/preserving-json-yaml-parser";
import { findJsonNodeValue, getRootAsJsonNodeValue, JsonNodeValue } from "../json-utils";
import { processSnippetParameters } from "../util";

export async function generateSchemaFixCommand(
  editor: vscode.TextEditor,
  issue: Issue,
  fix: InsertReplaceRenameFix | RegexReplaceFix | DeleteFix,
  genFrom: JsonNodeValue,
  inline: boolean,
  auditContext: AuditContext,
  cache: Cache,
  reportWebView: ReportWebView
) {
  const document = editor.document;
  const uri = document.uri.toString();
  const audit = auditContext.auditsByDocument[uri];
  if (!audit) {
    return;
  }
  const auditDocument = await vscode.workspace.openTextDocument(
    vscode.Uri.parse(audit.summary.documentUri)
  );
  const version = cache.getDocumentVersion(auditDocument);
  const genSchema = await astToJsonSchema(document, genFrom, version, cache);
  if (!genSchema) {
    return;
  }
  if (inline) {
    await insertSchemaInline(editor, issue, fix, genSchema, auditContext, cache);
  } else {
    const root = cache.getParsedDocument(document);
    const schemaNames = getSchemaNames(root, version);
    const schemaName = await vscode.window.showInputBox({
      value: getUniqueSchemaName(schemaNames),
      prompt: "Enter new schema name.",
      validateInput: (value) =>
        !schemaNames.has(value) ? null : "Please enter unique schema name",
    });
    if (schemaName) {
      await insertSchemaByRef(schemaName, editor, issue, fix, genSchema, auditContext, cache);
    }
  }
  updateReport(editor, [issue], auditContext, cache, reportWebView);
}

export function createGenerateSchemaAction(
  document: vscode.TextDocument,
  version: OpenApiVersion,
  root: Parsed,
  diagnostic: AuditDiagnostic,
  issue: Issue,
  fix: Fix
): vscode.CodeAction[] {
  if (fix.type !== FixType.Insert) {
    return [];
  }

  let genFrom = null;
  if (version === OpenApiVersion.V2) {
    genFrom = getSchemaV2Examples(issue.pointer, fix.problem, root);
    genFrom = genFrom || getSchemaV2Example(issue.pointer, fix.problem, root);
  } else {
    genFrom = getSchemaV3Examples(issue.pointer, fix.problem, root);
    genFrom = genFrom || getSchemaV3Example(issue.pointer, fix.problem, root);
  }

  if (genFrom) {
    const title = "Generate inline schema from examples";
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    action.command = {
      arguments: [issue, fix, genFrom, true],
      command: "openapi.generateSchemaQuickFix",
      title: title,
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = false;

    const place = version === OpenApiVersion.V2 ? "definitions" : "components";
    const title2 = "Generate schema from examples and place it in " + place;
    const action2 = new vscode.CodeAction(title2, vscode.CodeActionKind.QuickFix);
    action2.command = {
      arguments: [issue, fix, genFrom, false],
      command: "openapi.generateSchemaQuickFix",
      title: title2,
    };
    action2.diagnostics = [diagnostic];
    action2.isPreferred = false;

    return [action, action2];
  }
  return [];
}

async function insertSchemaInline(
  editor: vscode.TextEditor,
  issue: Issue,
  fix: InsertReplaceRenameFix | RegexReplaceFix | DeleteFix,
  genSchema: any,
  auditContext: AuditContext,
  cache: Cache
) {
  const document = editor.document;
  const uri = document.uri.toString();
  const audit = auditContext.auditsByDocument[uri];
  if (!audit) {
    return;
  }
  const auditDocument = await vscode.workspace.openTextDocument(
    vscode.Uri.parse(audit.summary.documentUri)
  );
  const bundle = await cache.getDocumentBundle(auditDocument);
  const version = cache.getDocumentVersion(auditDocument);

  const pointer = fix.pointer ? `${issue.pointer}${fix.pointer}` : issue.pointer;
  const root = cache.getParsedDocument(document);
  const target = findJsonNodeValue(root, pointer);

  const newFix = <InsertReplaceRenameFix>simpleClone(fix);
  newFix.fix = target.getKey() === "schema" ? genSchema : { schema: genSchema };
  delete newFix.parameters;

  const context: FixContext = {
    editor: editor,
    edit: null,
    issues: [issue],
    fix: newFix,
    bulk: false,
    auditContext: auditContext,
    version: version,
    bundle: bundle,
    root: root,
    target: target,
    document: document,
    skipConfirmation: true,
  };
  fixInsert(context);
  const params = context.snippetParameters;
  if (params) {
    await processSnippetParameters(editor, params, context["dropBrackets"]);
    await editor.insertSnippet(params.snippet, params.location);
  }
}

async function insertSchemaByRef(
  schemaName: string,
  editor: vscode.TextEditor,
  issue: Issue,
  fix: InsertReplaceRenameFix | RegexReplaceFix | DeleteFix,
  genSchema: any,
  auditContext: AuditContext,
  cache: Cache
) {
  const document = editor.document;
  const uri = document.uri.toString();
  const audit = auditContext.auditsByDocument[uri];
  if (!audit) {
    return;
  }
  const auditDocument = await vscode.workspace.openTextDocument(
    vscode.Uri.parse(audit.summary.documentUri)
  );
  const bundle = await cache.getDocumentBundle(auditDocument);
  const version = cache.getDocumentVersion(auditDocument);

  const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();

  const schemaFix = <InsertReplaceRenameFix>simpleClone(fix);
  schemaFix.fix = {};
  schemaFix.fix[schemaName] = genSchema;
  delete schemaFix.parameters;

  let target: JsonNodeValue;
  let pointer: string;
  const root = cache.getParsedDocument(document);

  if (version === OpenApiVersion.V2) {
    pointer = "/definitions";
    target = findJsonNodeValue(root, pointer);
    if (!target) {
      pointer = "";
      target = getRootAsJsonNodeValue(root);
      schemaFix.fix = {
        definitions: {},
      };
      schemaFix.fix["definitions"][schemaName] = genSchema;
    }
  } else {
    pointer = "/components/schemas";
    target = findJsonNodeValue(root, pointer);
    if (!target) {
      pointer = "/components";
      target = findJsonNodeValue(root, pointer);
      if (target) {
        schemaFix.fix = {
          schemas: {},
        };
        schemaFix.fix["schemas"][schemaName] = genSchema;
      } else {
        pointer = "";
        target = getRootAsJsonNodeValue(root);
        schemaFix.fix = {
          components: {
            schemas: {},
          },
        };
        schemaFix.fix["components"]["schemas"][schemaName] = genSchema;
      }
    }
  }

  const context: FixContext = {
    editor: editor,
    edit: edit,
    issues: [issue],
    fix: schemaFix,
    bulk: true,
    auditContext: auditContext,
    version: version,
    bundle: bundle,
    root: root,
    target: target,
    document: document,
    skipConfirmation: true,
  };
  fixInsert(context);

  const pointer2 = fix.pointer ? `${issue.pointer}${fix.pointer}` : issue.pointer;
  const target2 = findJsonNodeValue(root, pointer2);

  const schemaRefFix = <InsertReplaceRenameFix>simpleClone(fix);
  if (version === OpenApiVersion.V2) {
    if (target2.getKey() === "schema") {
      schemaRefFix.fix = {
        $ref: "#/definitions/" + schemaName,
      };
    } else {
      schemaRefFix.fix["schema"]["$ref"] = "#/definitions/" + schemaName;
    }
  } else {
    if (target2.getKey() === "schema") {
      schemaRefFix.fix = {
        $ref: "#/components/schemas/" + schemaName,
      };
    } else {
      schemaRefFix.fix["schema"]["$ref"] = "#/components/schemas/" + schemaName;
    }
  }
  delete schemaRefFix.parameters;

  const context2: FixContext = {
    editor: editor,
    edit: edit,
    issues: [issue],
    fix: schemaRefFix,
    bulk: true,
    auditContext: auditContext,
    version: version,
    bundle: bundle,
    root: root,
    target: target2,
    document: document,
    skipConfirmation: true,
  };
  fixInsert(context2);

  if (edit) {
    await vscode.workspace.applyEdit(edit);
  }
}

async function astToJsonSchema(
  document: vscode.TextDocument,
  genFrom: JsonNodeValue,
  version: OpenApiVersion,
  cache: Cache
): Promise<any> {
  try {
    if (version === OpenApiVersion.V2) {
      return generateSchema(await getJsonFromAST(genFrom, document, cache));
    } else {
      if (genFrom.getKey() === "example") {
        return generateSchema(await getJsonFromAST(genFrom, document, cache));
      } else {
        const values = [];
        for (const exampleChild of genFrom.getChildren()) {
          for (const contentChild of exampleChild.getChildren()) {
            if (contentChild.getKey() === "value") {
              values.push(await getJsonFromAST(contentChild, document, cache));
            }
          }
        }
        return generateOneOfSchema(values);
      }
    }
  } catch (err) {}
  return null;
}

async function getJsonFromAST(
  target: JsonNodeValue,
  document: vscode.TextDocument,
  cache: Cache
): Promise<any> {
  // FIXME check if targert contains a $ref (possibly to an external document) and follow it
  return target;
}

function hasId(id: string, problem: string[]): boolean {
  for (const problemId of problem) {
    if (problemId === id) {
      return true;
    }
  }
  return false;
}

function getUniqueSchemaName(schemaNames: Set<string>): string {
  const result = "GeneratedSchemaName";
  for (let index = 1; index < 1000; index++) {
    const newName = result + index;
    if (!schemaNames.has(newName)) {
      return newName;
    }
  }
  return "";
}

function getSchemaNames(root: Parsed, version: OpenApiVersion): Set<string> {
  const result: Set<string> = new Set();
  const schemas =
    version === OpenApiVersion.V2
      ? findJsonNodeValue(root, "/definitions")
      : findJsonNodeValue(root, "/components/schemas");
  if (schemas) {
    for (const schema of schemas.getChildren()) {
      result.add(schema.getKey());
    }
  }
  return result;
}

function getSchemaV2Examples(pointer: string, problem: string[], root: Parsed): any {
  if (hasId("response-schema-undefined", problem)) {
    const target = findJsonNodeValue(root, pointer);
    if (target && target.isObject()) {
      let schema: JsonNodeValue = null;
      let examples: JsonNodeValue = null;
      for (const child of target.getChildren()) {
        if (child.getKey() === "schema") {
          schema = child;
        } else if (child.getKey() === "examples") {
          examples = child;
        }
      }
      if (examples && !schema) {
        const children = examples.getChildren();
        if (children.length === 1) {
          const child = children[0];
          if (
            child.getKey() === "application/json" &&
            child.isObject() &&
            child.getChildren().length > 0
          ) {
            return child;
          }
        }
      }
    }
  }
  return null;
}

function getSchemaV2Example(pointer: string, problem: string[], root: Parsed): any {
  if (hasId("schema-request-notype", problem) || hasId("schema-response-notype", problem)) {
    const target = findJsonNodeValue(root, pointer);
    if (target && target.isObject() && target.getKey() === "schema") {
      const children = target.getChildren();
      if (children.length === 1) {
        const child = children[0];
        if (child.getKey() === "example") {
          return child;
        }
      }
    }
  }
  return null;
}

function getSchemaV3Examples(pointer: string, problem: string[], root: Parsed): any {
  // FIXME doesn't handle $ref in the examples
  if (
    hasId("v3-mediatype-request-schema-undefined", problem) ||
    hasId("v3-mediatype-response-schema-undefined", problem)
  ) {
    const target = findJsonNodeValue(root, pointer);
    if (target && target.isObject() && target.getKey() === "application/json") {
      let schema: JsonNodeValue = null;
      let examples: JsonNodeValue = null;
      for (const child of target.getChildren()) {
        if (child.getKey() === "schema") {
          schema = child;
        } else if (child.getKey() === "examples") {
          examples = child;
        }
      }
      if (examples && !schema) {
        const children = examples.getChildren();
        if (children.length > 0) {
          for (const exampleChild of children) {
            for (const contentChild of exampleChild.getChildren()) {
              if (contentChild.getKey() === "value") {
                return examples;
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function getSchemaV3Example(pointer: string, problem: string[], root: Parsed): any {
  if (hasId("v3-schema-request-notype", problem) || hasId("v3-schema-response-notype", problem)) {
    const target = findJsonNodeValue(root, pointer);
    if (target && target.isObject() && target.getKey() === "schema") {
      const children = target.getChildren();
      if (children.length === 1) {
        const child = children[0];
        if (child.getKey() === "example") {
          return child;
        }
      }
    }
  }
  return null;
}
