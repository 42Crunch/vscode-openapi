// @ts-nocheck FixContext is improperly initialized, but it should be ok for the test
import { testDeleteNode } from "../utils";
import { OpenApiVersion } from "../../types";

suite("Delete V2 Path", () => {
  test("Method delete path json", async () => {
    await testDeleteNode(
      "../../tests/delete/v2/delPath.json",
      "../../tests/delete/v2/delPath.exp.json",
      "json",
      OpenApiVersion.V2,
      "/paths/~1pets"
    );
  });

  test("Method delete path yaml", async () => {
    await testDeleteNode(
      "../../tests/delete/v2/delPath.yaml",
      "../../tests/delete/v2/delPath.exp.yaml",
      "yaml",
      OpenApiVersion.V2,
      "/paths/~1pets"
    );
  });

  test("Method delete path json (2)", async () => {
    await testDeleteNode(
      "../../tests/delete/v2/delPath2.json",
      "../../tests/delete/v2/delPath2.exp.json",
      "json",
      OpenApiVersion.V2,
      "/paths/~1pets"
    );
  });

  test("Method delete path yaml (2)", async () => {
    await testDeleteNode(
      "../../tests/delete/v2/delPath2.yaml",
      "../../tests/delete/v2/delPath2.exp.yaml",
      "yaml",
      OpenApiVersion.V2,
      "/paths/~1pets"
    );
  });

  test("Method delete path json (3)", async () => {
    await testDeleteNode(
      "../../tests/delete/v2/delPath3.json",
      "../../tests/delete/v2/delPath3.exp.json",
      "json",
      OpenApiVersion.V2,
      "/paths/~1pets"
    );
  });

  test("Method delete path yaml (3)", async () => {
    await testDeleteNode(
      "../../tests/delete/v2/delPath3.yaml",
      "../../tests/delete/v2/delPath3.exp.yaml",
      "yaml",
      OpenApiVersion.V2,
      "/paths/~1pets"
    );
  });
});
