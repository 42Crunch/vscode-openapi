// @ts-nocheck FixContext is improperly initialized, but it should be ok for the test
import { testDeleteNode } from "../utils";
import { OpenApiVersion } from "../../types";

suite("Delete V3 Path & Operation", () => {
  test("Method delete path json", async () => {
    await testDeleteNode(
      "../../tests/delete/v3/delPath.json",
      "../../tests/delete/v3/delPath.exp.json",
      "json",
      OpenApiVersion.V3,
      "/paths/~1api~1register"
    );
  });

  test("Method delete path yaml", async () => {
    await testDeleteNode(
      "../../tests/delete/v3/delPath.yaml",
      "../../tests/delete/v3/delPath.exp.yaml",
      "yaml",
      OpenApiVersion.V3,
      "/paths/~1api~1register"
    );
  });

  test("Method delete operation json", async () => {
    await testDeleteNode(
      "../../tests/delete/v3/delOp.json",
      "../../tests/delete/v3/delOp.exp.json",
      "json",
      OpenApiVersion.V3,
      "/paths/~1api~1register/post"
    );
  });

  test("Method delete operation yaml", async () => {
    await testDeleteNode(
      "../../tests/delete/v3/delOp.yaml",
      "../../tests/delete/v3/delOp.exp.yaml",
      "yaml",
      OpenApiVersion.V3,
      "/paths/~1api~1register/post"
    );
  });
});
