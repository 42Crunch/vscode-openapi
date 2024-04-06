import { Scanconf } from "@xliic/scanconf";

import { expect, test } from "vitest";
import { compare } from "../index";

test("compare equal", async () => {
  const changes = compare(
    {
      paths: {
        "/foo": {
          get: { operationId: "getFoo" },
          post: { operationId: "postFoo" },
        },
      },
    } as any,
    {
      operations: { getFoo: {}, postFoo: {} },
    } as any
  );
  expect(changes).toEqual([]);
});

test("find removed operation", async () => {
  const changes = compare(
    {
      paths: {
        "/foo": {
          get: { operationId: "getFoo" },
        },
      },
    } as any,
    {
      operations: { getFoo: {}, postFoo: {} },
    } as any
  );
  expect(changes).toEqual([
    {
      operationId: "postFoo",
      type: "operation-removed",
    },
  ]);
});

test("find added operation", async () => {
  const changes = compare(
    {
      paths: {
        "/foo": {
          get: { operationId: "getFoo" },
          post: { operationId: "postFoo" },
        },
      },
    } as any,
    {
      operations: { getFoo: {} },
    } as any
  );
  expect(changes).toEqual([
    {
      operationId: "postFoo",
      type: "operation-added",
      path: "/foo",
      method: "post",
    },
  ]);
});
