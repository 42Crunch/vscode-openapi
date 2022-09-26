/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import type { BundledOpenApiSpec, RefOr } from "./oas30";

export type PathSegment = string;
export type Path = PathSegment[];

const SLASHES = /\//g;
const TILDES = /~/g;

export function parseJsonPointer(pointer: string): Path {
  const hasExcape = /~/;
  const escapeMatcher = /~[01]/g;
  function escapeReplacer(m: string) {
    switch (m) {
      case "~1":
        return "/";
      case "~0":
        return "~";
    }
    throw new Error("Invalid tilde escape: " + m);
  }

  function untilde(str: string) {
    if (!hasExcape.test(str)) {
      return str;
    }
    return str.replace(escapeMatcher, escapeReplacer);
  }

  return pointer.split("/").slice(1).map(untilde).map(decodeURIComponent);
}

export function findByPath(target: unknown, path: Path): any | undefined {
  let current: any = target;
  for (const segment of path) {
    if (typeof current === "object" && current !== null) {
      if (Array.isArray(current)) {
        const index = parseInt(segment, 10);
        if (isNaN(index)) {
          return undefined;
        }
        current = current[index];
      } else if (current.hasOwnProperty(segment)) {
        current = current[segment];
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  return current;
}

export function find(target: unknown, pointer: string | string[]): unknown | undefined {
  if (Array.isArray(pointer)) {
    return findByPath(target, pointer);
  }
  return findByPath(target, parseJsonPointer(pointer));
}

export function deref<T>(oas: BundledOpenApiSpec, maybeRef: RefOr<T> | undefined): T | undefined {
  if (maybeRef === undefined || maybeRef === null) {
    return undefined;
  }
  if ("$ref" in maybeRef) {
    const refTarget = find(oas, maybeRef.$ref);
    return refTarget as T;
  }
  return maybeRef;
}
