import assert from "assert";
import {
  assertTagsOrder,
  ignoreJsonTextFeatures,
  replaceKey,
  replaceValue,
  withRandomFileEditor,
  wrap,
} from "../utils";
import {
  addBasePath,
  addDefinitionObject,
  addHost,
  addInfo,
  addOperation,
  addParameterBody,
  addParameterOther,
  addParameterPath,
  addPath,
  addResponse,
  addSecurity,
  addSecurityDefinitionApiKey,
  addSecurityDefinitionBasic,
  addSecurityDefinitionOauth2Access,
  v3addComponentsParameter,
  v3addComponentsResponse,
  v3addComponentsSchema,
  v3addInfo,
  v3addSecuritySchemeApiKey,
  v3addSecuritySchemeBasic,
  v3addSecuritySchemeJWT,
  v3addSecuritySchemeOauth2Access,
  v3addServer,
} from "../commands";
import { parserOptions } from "../../parser-options";
import { Cache } from "../../cache";
import { readFileSync } from "fs";
import { resolve } from "path";
import { safeParse } from "../../util";

const selectors = {
  json: { language: "json" },
  jsonc: { language: "jsonc" },
  yaml: { language: "yaml" },
};

suite("Snippets For JSON with Edit", () => {
  //@ts-ignore passing null to Cache should be okay in the context of the test
  const cache = new Cache(parserOptions, Object.values(selectors), null);

  test("Version 3 Spaces 2", async () => {
    const text = '{\n  "openapi": "3.0.0"\n}';
    const expected = readFileSync(resolve(__dirname, "../../../tests/snippets/v3.spaces2.json"), {
      encoding: "utf8",
    });
    assertTagsOrder(safeParse(expected, "json"));

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      await v3addInfo(cache, true);

      await v3addComponentsResponse(cache, true);
      await replaceKey(editor, "/components/responses/name", "responsesKey");
      await v3addComponentsResponse(cache, true);

      await v3addComponentsParameter(cache, true);
      await replaceKey(editor, "/components/parameters/name", "parametersKey");
      await v3addComponentsParameter(cache, true);

      await v3addComponentsSchema(cache, true);
      await replaceKey(editor, "/components/schemas/name", "schemasKey");
      await v3addComponentsSchema(cache, true);

      await v3addSecuritySchemeBasic(cache, true);
      await replaceKey(editor, "/components/securitySchemes/name", "schemeBasic");

      await v3addSecuritySchemeApiKey(cache, true);
      await replaceKey(editor, "/components/securitySchemes/name", "schemeApiKey");

      await v3addSecuritySchemeJWT(cache, true);
      await replaceKey(editor, "/components/securitySchemes/name", "schemeJWT");

      await v3addSecuritySchemeOauth2Access(cache, true);
      await replaceKey(editor, "/components/securitySchemes/name", "schemeOauth2Access");

      await v3addServer(cache, true);
      await replaceValue(editor, "/servers/0/url", "https://elvis.bom/v1");
      await v3addServer(cache, true);

      await addPath(cache, true);
      await replaceKey(editor, "/paths/~1name", "/path1");
      await replaceKey(editor, "/paths/~1path1/get", "put");
      await addOperation(cache, { parent: { key: "/path1" } }, true);
      await addPath(cache, true);

      assert.ok(doc.isDirty);
      assert.strictEqual(wrap(doc.getText()), wrap(expected));
    });
  });

  test("Version 3 Spaces 3", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/snippets/v3.spaces3.draft.json"), {
      encoding: "utf8",
    });
    const expected = readFileSync(resolve(__dirname, "../../../tests/snippets/v3.spaces3.json"), {
      encoding: "utf8",
    });
    assertTagsOrder(safeParse(expected, "json"));

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      await v3addInfo(cache, true);

      await v3addComponentsResponse(cache, true);
      await replaceKey(editor, "/components/responses/name", "responsesKey");
      await v3addComponentsResponse(cache, true);

      await v3addComponentsParameter(cache, true);
      await replaceKey(editor, "/components/parameters/name", "parametersKey");
      await v3addComponentsParameter(cache, true);

      await v3addComponentsSchema(cache, true);
      await replaceKey(editor, "/components/schemas/name", "schemasKey");
      await v3addComponentsSchema(cache, true);

      await v3addSecuritySchemeBasic(cache, true);
      await replaceKey(editor, "/components/securitySchemes/name", "schemeBasic");

      await v3addSecuritySchemeApiKey(cache, true);
      await replaceKey(editor, "/components/securitySchemes/name", "schemeApiKey");

      await v3addSecuritySchemeJWT(cache, true);
      await replaceKey(editor, "/components/securitySchemes/name", "schemeJWT");

      await v3addSecuritySchemeOauth2Access(cache, true);
      await replaceKey(editor, "/components/securitySchemes/name", "schemeOauth2Access");

      await v3addServer(cache, true);
      await replaceValue(editor, "/servers/0/url", "https://elvis.bom/v1");
      await v3addServer(cache, true);

      await addPath(cache, true);
      await replaceKey(editor, "/paths/~1name", "/path1");
      await replaceKey(editor, "/paths/~1path1/get", "put");
      await addOperation(cache, { parent: { key: "/path1" } }, true);
      await addPath(cache, true);

      assert.ok(doc.isDirty);
      assert.strictEqual(ignoreJsonTextFeatures(wrap(doc.getText())), wrap(expected));
    });
  });

  test("Version 2 Spaces 4", async () => {
    const text = '{\n    "swagger": "2.0"\n}';
    const expected = readFileSync(resolve(__dirname, "../../../tests/snippets/v2.spaces4.json"), {
      encoding: "utf8",
    });
    assertTagsOrder(safeParse(expected, "json"));

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      await addBasePath(cache, true);
      await addHost(cache, true);
      await addInfo(cache, true);
      await addPath(cache, true);

      await addSecurityDefinitionBasic(cache, true);
      await replaceKey(editor, "/securityDefinitions/name", "defBasicBasicKey");

      await addSecurityDefinitionOauth2Access(cache, true);
      await replaceKey(editor, "/securityDefinitions/name", "defOauth2Access");

      await addSecurityDefinitionApiKey(cache, true);
      await replaceKey(editor, "/securityDefinitions/name", "defApiKey");

      await addSecurity(cache, true);
      await replaceKey(editor, "/security/0/name", "securityKey");
      await addSecurity(cache, true);

      await addDefinitionObject(cache, true);
      await replaceKey(editor, "/definitions/name", "defKey");
      await addDefinitionObject(cache, true);

      await addParameterPath(cache, true);
      await replaceKey(editor, "/parameters/name", "paramKey");

      await addParameterBody(cache, true);
      await replaceKey(editor, "/parameters/name", "bodyKey");

      await addParameterOther(cache, true);
      await replaceKey(editor, "/parameters/name", "otherKey");

      await addResponse(cache, true);
      await replaceKey(editor, "/responses/code", "200");
      await addResponse(cache, true);

      await replaceKey(editor, "/paths/~1name", "/path1");
      await replaceKey(editor, "/paths/~1path1/get", "put");
      await addOperation(cache, { parent: { key: "/path1" } }, true);
      await addPath(cache, true);

      assert.ok(doc.isDirty);
      assert.strictEqual(wrap(doc.getText()), wrap(expected));
    });
  });

  test("Version 2 Spaces 5", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/snippets/v2.spaces5.draft.json"), {
      encoding: "utf8",
    });
    const expected = readFileSync(resolve(__dirname, "../../../tests/snippets/v2.spaces5.json"), {
      encoding: "utf8",
    });
    assertTagsOrder(safeParse(expected, "json"));

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      await addBasePath(cache, true);
      await addHost(cache, true);
      await addInfo(cache, true);
      await addPath(cache, true);

      await addSecurityDefinitionBasic(cache, true);
      await replaceKey(editor, "/securityDefinitions/name", "defBasicBasicKey");

      await addSecurityDefinitionOauth2Access(cache, true);
      await replaceKey(editor, "/securityDefinitions/name", "defOauth2Access");

      await addSecurityDefinitionApiKey(cache, true);
      await replaceKey(editor, "/securityDefinitions/name", "defApiKey");

      await addSecurity(cache, true);
      await replaceKey(editor, "/security/0/name", "securityKey");
      await addSecurity(cache, true);

      await addDefinitionObject(cache, true);
      await replaceKey(editor, "/definitions/name", "defKey");
      await addDefinitionObject(cache, true);

      await addParameterPath(cache, true);
      await replaceKey(editor, "/parameters/name", "paramKey");

      await addParameterBody(cache, true);
      await replaceKey(editor, "/parameters/name", "bodyKey");

      await addParameterOther(cache, true);
      await replaceKey(editor, "/parameters/name", "otherKey");

      await addResponse(cache, true);
      await replaceKey(editor, "/responses/code", "200");
      await addResponse(cache, true);

      await replaceKey(editor, "/paths/~1name", "/path1");
      await replaceKey(editor, "/paths/~1path1/get", "put");
      await addOperation(cache, { parent: { key: "/path1" } }, true);
      await addPath(cache, true);

      assert.ok(doc.isDirty);
      assert.strictEqual(ignoreJsonTextFeatures(wrap(doc.getText())), wrap(expected));
    });
  });
});
