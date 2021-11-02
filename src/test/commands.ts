import { Cache } from "../cache";
import { snippetCommand, registeredSnippetQuickFixes } from "../commands";
import { joinJsonPointer } from "../pointer";

export async function addBasePath(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["basePath"], cache, useEdit);
}

export async function addHost(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["host"], cache, useEdit);
}

export async function addInfo(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["info"], cache, useEdit);
}

export async function v3addInfo(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["info"], cache, useEdit);
}

export async function addPath(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["path"], cache, useEdit);
}

export async function addSecurityDefinitionBasic(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["securityBasic"], cache, useEdit);
}

export async function addSecurityDefinitionOauth2Access(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["securityOauth2Access"], cache, useEdit);
}

export async function addSecurityDefinitionApiKey(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["securityApiKey"], cache, useEdit);
}

export async function addSecurity(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["security"], cache, useEdit);
}

export async function addDefinitionObject(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["definitionObject"], cache, useEdit);
}

export async function addParameterPath(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["parameterPath"], cache, useEdit);
}

export async function addParameterBody(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["parameterBody"], cache, useEdit);
}

export async function addParameterOther(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["parameterOther"], cache, useEdit);
}

export async function addResponse(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["response"], cache, useEdit);
}

export async function v3addComponentsResponse(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["componentsResponse"], cache, useEdit);
}

export async function v3addComponentsParameter(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["componentsParameter"], cache, useEdit);
}

export async function v3addComponentsSchema(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSchema"], cache, useEdit);
}

export async function v3addSecuritySchemeBasic(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSecurityBasic"], cache, useEdit);
}

export async function v3addSecuritySchemeApiKey(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSecurityApiKey"], cache, useEdit);
}

export async function v3addSecuritySchemeJWT(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["componentsSecurityJwt"], cache, useEdit);
}

export async function v3addSecuritySchemeOauth2Access(cache: Cache, useEdit?: boolean) {
  await snippetCommand(
    registeredSnippetQuickFixes["componentsSecurityOauth2Access"],
    cache,
    useEdit
  );
}

export async function v3addServer(cache: Cache, useEdit?: boolean) {
  await snippetCommand(registeredSnippetQuickFixes["server"], cache, useEdit);
}

export async function addOperation(cache: Cache, node: any, useEdit?: boolean) {
  const fix = registeredSnippetQuickFixes["operation"];
  fix.pointer = joinJsonPointer(["paths", node.parent.key]);
  await snippetCommand(fix, cache, useEdit);
}
