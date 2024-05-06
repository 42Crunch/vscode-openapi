import { HttpMethod } from "@xliic/openapi";
import { StageLocation } from "./references/types";

export type OperationAdded = {
  type: "operation-added";
  path: string;
  method: HttpMethod;
  operationId: string;
};

export type OperationRemoved = {
  type: "operation-removed";
  operationId: string;
  method: HttpMethod;
  path: string;
  references: StageLocation[];
};

export type OperationRenamed = {
  type: "operation-renamed";
  path: string;
  method: HttpMethod;
  oldOperationId: string;
  newOperationId: string;
};

export type Change = OperationAdded | OperationRemoved | OperationRenamed | SecurityAdded;

export type OperationId = {
  path: string;
  method: HttpMethod;
  operationId: string;
};

export type SecurityAdded = {
  type: "security-added";
  schema: string;
};
