import assert from "assert";
import { loadJson, loadYaml, withRandomFileEditor } from "../utils";
import { getFixAsJsonString, getFixAsYamlString, safeParse } from "../../util";
import { resolve } from "path";
import { FixContext, FixType, InsertReplaceRenameFix } from '../../types';
import { readFileSync } from 'fs';

suite("Edit Get Fix As String Test Suite", () => {

  test("Method getFixAsJsonString test", async () => {

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
        pointer: pointer,
        root: root,
        target: root.find(pointer),
        document: editor.document
      };
  
      const fix = {
        problem: ["v3-response-400"],
        title: "Add 404 response",
        type: FixType.Insert,
        fix: {
          "400": {
            $ref: "#/abc"
          }
        }
      };
  
      context.fix = <InsertReplaceRenameFix>fix;
      context.snippet = false;
      assert.equal(
        '"400": {\n\t"$ref": "#/abc"\n}',
        getFixAsJsonString(context)
      );

      context.snippet = true;
      assert.equal(
        '"400": {\n\t"\\$ref": "#/abc"\n}',
        getFixAsJsonString(context)
      );
  
      context.fix.parameters = [
        {
          name: "code",
          path: "/400/$ref",
          values: ["a", "b", "c,d, e"]
        }
      ];
      context.snippet = true;
      assert.equal(
        '"400": {\n\t"\\$ref": "${1|a,b,c\\,d\\, e|}"\n}',
        getFixAsJsonString(context)
      );
  
      context.fix.parameters = [
        {
          name: "code",
          type: "key",
          path: "/400"
        }
      ];
      context.snippet = true;
      assert.equal(
        '"${1:400}": {\n\t"\\$ref": "#/abc"\n}',
        getFixAsJsonString(context)
      );
    });
  });

  test("Method getFixAsYamlString test", async () => {

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
        pointer: pointer,
        root: root,
        target: root.find(pointer),
        document: editor.document
      };
  
      const fix = {
        problem: ["v3-response-400"],
        title: "Add 404 response",
        type: FixType.Insert,
        fix: {
          "400": {
            $ref: "#/abc"
          }
        }
      };
  
      context.fix = <InsertReplaceRenameFix>fix;
      context.snippet = false;
      assert.equal(
        "'400':\n\t$ref: '#/abc'",
        getFixAsYamlString(context)
      );

      context.snippet = true;
      assert.equal(
        "'400':\n\t\\$ref: '#/abc'",
        getFixAsYamlString(context)
      );
  
      context.fix.parameters = [
        {
          name: "code",
          path: "/400/$ref",
          values: ["a", "b", "c,d, e"]
        }
      ];
      context.snippet = true;
      assert.equal(
        "'400':\n\t\\$ref: '${1|a,b,c\\,d\\, e|}'",
        getFixAsYamlString(context)
      );
  
      context.fix.parameters = [
        {
          name: "code",
          type: "key",
          path: "/400"
        }
      ];
      context.snippet = true;
      assert.equal(
        "'${1:400}':\n\t\\$ref: '#/abc'",
        getFixAsYamlString(context)
      );  
    });
  });
});
