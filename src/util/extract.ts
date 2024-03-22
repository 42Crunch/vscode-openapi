/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { parseJsonPointer, Path, simpleClone } from "@xliic/preserving-json-yaml-parser";
import { BundledSwaggerOrOasSpec, HttpMethod } from "@xliic/openapi";

export function walk(current: any, parent: any, path: string[], visitor: any) {
  for (const key of Object.keys(current)) {
    const value = current[key];
    if (typeof value === "object" && value !== null) {
      walk(value, current, [key, ...path], visitor);
    } else {
      visitor(parent, path, key, value);
    }
  }
}

export function extractSinglePath(path: string, oas: any): BundledSwaggerOrOasSpec {
  const visited = new Set<string>();
  crawl(oas, oas["paths"][path], visited);

  const cloned: any = simpleClone(oas);
  delete cloned["paths"];
  delete cloned["components"];
  delete cloned["definitions"];

  // copy single path and path parameters
  cloned["paths"] = { [path]: oas["paths"][path] };

  // copy security schemes
  if (oas?.["components"]?.["securitySchemes"]) {
    cloned["components"] = { securitySchemes: oas["components"]["securitySchemes"] };
  }
  copyByPointer(oas, cloned, Array.from(visited));
  return cloned as BundledSwaggerOrOasSpec;
}

export function extractSingleOperation(
  method: HttpMethod,
  path: string,
  oas: any
): BundledSwaggerOrOasSpec {
  const visited = new Set<string>();
  crawl(oas, oas["paths"][path][method], visited);
  if (oas["paths"][path]["parameters"]) {
    crawl(oas, oas["paths"][path]["parameters"], visited);
  }
  const cloned: any = simpleClone(oas);
  delete cloned["paths"];
  delete cloned["components"];
  delete cloned["definitions"];

  // copy single path and path parameters
  cloned["paths"] = { [path]: { [method]: oas["paths"][path][method] } };
  if (oas["paths"][path]["parameters"]) {
    cloned["paths"][path]["parameters"] = oas["paths"][path]["parameters"];
  }
  // copy security schemes
  if (oas?.["components"]?.["securitySchemes"]) {
    cloned["components"] = { securitySchemes: oas["components"]["securitySchemes"] };
  }
  copyByPointer(oas, cloned, Array.from(visited));
  return cloned as BundledSwaggerOrOasSpec;
}

function crawl(root: any, current: any, visited: Set<string>) {
  if (current === null || typeof current !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(current)) {
    if (key === "$ref") {
      const path = (<string>value).substring(1, (<string>value).length);
      if (!visited.has(path)) {
        visited.add(path);
        const ref = resolveRef(root, path);
        crawl(root, ref, visited);
      }
    } else {
      crawl(root, value, visited);
    }
  }
}

function resolveRef(root: any, pointer: string) {
  const path = parseJsonPointer(pointer);
  let current = root;
  for (let i = 0; i < path.length; i++) {
    current = current[path[i]];
  }
  return current;
}

function copyByPointer(src: any, dest: any, pointers: string[]) {
  const sortedPointers = [...pointers];
  sortedPointers.sort();
  for (const pointer of sortedPointers) {
    const path = parseJsonPointer(pointer);
    copyByPath(src, dest, path);
  }
}

function copyByPath(src: any, dest: any, path: Path): void {
  let currentSrc = src;
  let currentDest = dest;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    currentSrc = currentSrc[key];
    if (currentDest[key] === undefined) {
      if (Array.isArray(currentSrc[key])) {
        currentDest[key] = [];
      } else {
        currentDest[key] = {};
      }
    }
    currentDest = currentDest[key];
  }
  const key = path[path.length - 1];
  // check if the last segment of the path that is being copied is already set
  // which might be the case if we've copied the parent of the path already
  if (currentDest[key] === undefined) {
    currentDest[key] = currentSrc[key];
  }
}
