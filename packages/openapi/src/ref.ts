import { find } from "./jsonpointer";

export interface Ref {
  $ref: string;
}

export type RefOr<T> = Ref | T;

export function deref<T>(document: unknown, maybeRef: RefOr<T> | undefined): T | undefined {
  if (maybeRef === undefined || maybeRef === null) {
    return undefined;
  }

  if (typeof maybeRef === "object" && "$ref" in maybeRef) {
    const refTarget = find(document, maybeRef.$ref);
    return refTarget as T;
  }

  return maybeRef;
}
