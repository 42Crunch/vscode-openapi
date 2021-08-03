import * as vscode from "vscode";
import * as yaml from "js-yaml";
import * as json from "jsonc-parser";
import assert from "assert";
import { withRandomFileEditor } from "../utils";
import { resolve } from "path";
import { readFileSync } from "fs";
import { parseToAst } from "../../parsers";
import { ParserOptions, parserOptions } from "../../parser-options";
import { parse, simpleClone, stringify } from '@xliic/preserving-json-yaml-parser';

suite("Parse AST To Object Test Suite", () => {
  test("Test Json 1", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.json"), { encoding: "utf8" });

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      const object = parseToObject(editor.document, parserOptions);
      assert.ok(object);

      const root = parseToAst(editor.document, parserOptions)[1];
      const object2 = parse(editor.document.getText(), root);
      assert.ok(object2);

      assert.deepEqual(object2, object);
    });
  });

  test("Test Json 2", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/petstore-v3.json"), {
      encoding: "utf8",
    });

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      const object = parseToObject(editor.document, parserOptions);
      assert.ok(object);

      const root = parseToAst(editor.document, parserOptions)[1];
      const object2 = parse(editor.document.getText(), root);
      assert.ok(object2);

      assert.deepEqual(object2, object);
    });
  });

  test("Test Yaml 1", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/xkcd.yaml"), { encoding: "utf8" });

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {
      const object = parseToObject(editor.document, parserOptions);
      assert.ok(object);

      const root = parseToAst(editor.document, parserOptions)[1];
      const object2 = parse(editor.document.getText(), root);
      assert.ok(object2);

      assert.deepEqual(object2, object);
    });
  });

  test("Test Yaml 2", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/petstore-v3.yaml"), {
      encoding: "utf8",
    });

    assert(text.indexOf("Pet: &anchor1") > 0 && text.indexOf("<<: *anchor1") > 0);
    assert(text.indexOf("id: &anchor2") > 0 && text.indexOf("<<: *anchor2") > 0);
    assert(text.indexOf("- &anchor3 pets") > 0 && text.indexOf("- *anchor3") > 0);
    assert(text.indexOf("$ref: &anchor4") > 0 && text.indexOf("$ref: *anchor4") > 0);
    assert(text.indexOf("headers: &anchor5") > 0 && text.indexOf("headers: *anchor5") > 0);

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {
      const object = parseToObject(editor.document, parserOptions);
      assert.ok(object);

      const root = parseToAst(editor.document, parserOptions)[1];
      const object2 = parse(editor.document.getText(), root);
      assert.ok(object2);

      assert.deepEqual(object2, object);
    });
  });

  test("Test Boundary Json 3", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/boundary.json"), {
      encoding: "utf8",
    });
    assertNumberFormatNotCorrupted(text, false);

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      const object = parseToObject(editor.document, parserOptions);
      assert.ok(object);

      const root = parseToAst(editor.document, parserOptions)[1];
      const object2 = parse(editor.document.getText(), root);
      assert.ok(object2);

      // Test custom stringify
      assert.equal(JSON.stringify(object), stringify(object));
      // Test tricky numbers are safe
      const object2Text = stringify(object2);
      assertNumberFormatNotCorrupted(object2Text, false);
      // Test object are the same from two different text sources
      const object3 = JSON.parse(object2Text);
      assert.deepEqual(object3, object);
    });
  });

  test("Test Boundary Yaml 3", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/boundary.yaml"), {
      encoding: "utf8",
    });
    assertNumberFormatNotCorrupted(text, true);

    await withRandomFileEditor(text, "yaml", async (editor, doc) => {
      const object = parseToObject(editor.document, parserOptions);
      assert.ok(object);

      const root = parseToAst(editor.document, parserOptions)[1];
      const object2 = parse(editor.document.getText(), root);
      assert.ok(object2);

      // Test custom stringify
      assert.equal(JSON.stringify(object), stringify(object));
      // Test tricky numbers are safe
      const object2Text = stringify(object2);
      assertNumberFormatNotCorrupted(object2Text, false);
      // Test object are the same from two different text sources
      const object3 = JSON.parse(object2Text);
      assert.deepEqual(object3, object);
    });
  });

  test("Test Simple Clone", async () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/boundary.json"), {
      encoding: "utf8",
    });
    assertNumberFormatNotCorrupted(text, false);

    await withRandomFileEditor(text, "json", async (editor, doc) => {
      const object = parseToObject(editor.document, parserOptions);
      assert.ok(object);

      const root = parseToAst(editor.document, parserOptions)[1];
      const object2 = parse(editor.document.getText(), root);
      assert.ok(object2);
      const object2Text = stringify(object2);
      assertNumberFormatNotCorrupted(object2Text, false);

      const object3 = simpleClone(object2);
      assert.ok(object3);
      const object3Text = stringify(object3);
      assertNumberFormatNotCorrupted(object3Text, false);

      // Test object are the same from two different text sources
      assert.deepEqual(object3, object2);
    });
  });

  test("Test Stringify", async () => {
    assert.equal(stringify(null), JSON.stringify(null));
    assert.equal(stringify(undefined), JSON.stringify(undefined));

    assert.equal(stringify({}), JSON.stringify({}));
    assert.equal(stringify(true), JSON.stringify(true));
    assert.equal(stringify("foo"), JSON.stringify("foo"));

    assert.equal(stringify({ x: 5 }), JSON.stringify({ x: 5 }));
    assert.equal(stringify({ x: 5, y: 6 }), JSON.stringify({ x: 5, y: 6 }));
    assert.equal(stringify([1, "false", false]), JSON.stringify([1, "false", false]));

    const value = [new Number(1), new String("false"), new Boolean(false)];
    assert.equal(stringify(value), JSON.stringify(value));

    const value2 = { x: undefined, y: Object, z: Symbol("") };
    assert.equal(stringify(value2), JSON.stringify(value2));

    const value3 = [undefined, Object, Symbol("")];
    assert.equal(stringify(value3), JSON.stringify(value3));

    const value4 = { [Symbol("foo")]: "foo" };
    assert.equal(stringify(value4), JSON.stringify(value4));
  });

  function assertNumberFormatNotCorrupted(
    text: string,
    checkNumberReadabilityFeature: boolean
  ): void {
    assert(text.indexOf("900719925474099665656") !== -1);
    assert(text.indexOf("1.00000") !== -1);
    assert(text.indexOf("-1007199254740996656565643") !== -1);
    if (checkNumberReadabilityFeature) {
      assert(text.indexOf("666666_777777_888888_99999") !== -1);
    } else {
      assert(text.indexOf("66666677777788888899999") !== -1);
    }
    assert(text.indexOf("6.000e23") !== -1);
  }

  function parseToObject(document: vscode.TextDocument, options: ParserOptions): any | undefined {
    if (
      !(
        document.languageId === "json" ||
        document.languageId === "jsonc" ||
        document.languageId == "yaml"
      )
    ) {
      return null;
    }

    try {
      if (document.languageId === "yaml") {
        // FIXME what's up with parsing errors?
        const {
          yaml: { schema },
        } = options.get();
        return yaml.safeLoad(document.getText(), { schema });
      }

      const errors: json.ParseError[] = [];
      const parsed = json.parse(document.getText(), errors, { allowTrailingComma: true });
      if (errors.length == 0) {
        return parsed;
      }
    } catch (ex) {
      // ignore, return undefined on parsing errors
    }
  }
});
