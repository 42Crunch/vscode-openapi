import assert from "assert";
import { withRandomFileEditor } from "../utils";
import { getFixAsJsonString, getFixAsYamlString, safeParse } from "../../util";
import { resolve } from "path";
import { FixContext, FixType, InsertReplaceRenameFix } from "../../types";
import { readFileSync } from "fs";
import { findJsonNodeValue } from "../../json-utils";

suite("Get Fix As String", () => {
  test("Method getFixAsJsonString", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.json"), { encoding: "utf8" });

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      const pointer = "/paths/~1info.0.json/get/responses/200";
      const root = safeParse(editor.document.getText(), editor.document.languageId);

      const context: FixContext = {
        editor: editor,
        edit: null,
        issues: [],
        fix: null,
        bulk: false,
        auditContext: null,
        version: null,
        bundle: null,
        root: root,
        target: findJsonNodeValue(root, pointer),
        document: editor.document,
      };

      const fix = {
        problem: ["v3-response-400"],
        title: "Add 404 response",
        type: FixType.Insert,
        fix: {
          "400": {
            $ref: "#/abc",
          },
        },
      };

      context.fix = <InsertReplaceRenameFix>fix;
      context.snippet = false;
      assert.strictEqual('"400": {\n\t"$ref": "#/abc"\n}', getFixAsJsonString(context));

      context.snippet = true;
      assert.strictEqual('"400": {\n\t"\\$ref": "#/abc"\n}', getFixAsJsonString(context));

      context.fix.parameters = [
        {
          name: "code",
          path: "/400/$ref",
          values: ["a", "b", "c,d, e"],
        },
      ];
      context.snippet = true;
      assert.strictEqual(
        '"400": {\n\t"\\$ref": "${1|a,b,c\\,d\\, e|}"\n}',
        getFixAsJsonString(context)
      );

      context.fix.parameters = [
        {
          name: "code",
          type: "key",
          path: "/400",
        },
      ];
      context.snippet = true;
      assert.strictEqual('"${1:400}": {\n\t"\\$ref": "#/abc"\n}', getFixAsJsonString(context));
    });
  });

  test("Method getFixAsYamlString", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.yaml"), { encoding: "utf8" });

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {
      const pointer = "/paths/~1info.0.json/get/responses/200";
      const root = safeParse(editor.document.getText(), editor.document.languageId);

      const context: FixContext = {
        editor: editor,
        edit: null,
        issues: [],
        fix: null,
        bulk: false,
        auditContext: null,
        version: null,
        bundle: null,
        root: root,
        target: findJsonNodeValue(root, pointer),
        document: editor.document,
      };

      const fix = {
        problem: ["v3-response-400"],
        title: "Add 404 response",
        type: FixType.Insert,
        fix: {
          "400": {
            $ref: "#/abc",
          },
        },
      };

      context.fix = <InsertReplaceRenameFix>fix;
      context.snippet = false;
      assert.strictEqual("'400':\n\t$ref: '#/abc'", getFixAsYamlString(context));

      context.snippet = true;
      assert.strictEqual("'400':\n\t\\$ref: '#/abc'", getFixAsYamlString(context));

      context.fix.parameters = [
        {
          name: "code",
          path: "/400/$ref",
          values: ["a", "b", "c,d, e"],
        },
      ];
      context.snippet = true;
      assert.strictEqual("'400':\n\t\\$ref: '${1|a,b,c\\,d\\, e|}'", getFixAsYamlString(context));

      context.fix.parameters = [
        {
          name: "code",
          type: "key",
          path: "/400",
        },
      ];
      context.snippet = true;
      assert.strictEqual("'${1:400}':\n\t\\$ref: '#/abc'", getFixAsYamlString(context));
    });
  });
});
