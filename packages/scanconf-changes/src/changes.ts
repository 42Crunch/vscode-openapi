import { HttpMethod } from "@xliic/openapi";

export type OperationAdded = {
  type: "operation-added";
  path: string;
  method: HttpMethod;
  operationId: string;
};

export type OperationRemoved = {
  type: "operation-removed";
  operationId: string;
};

export type Change = OperationAdded | OperationRemoved;
