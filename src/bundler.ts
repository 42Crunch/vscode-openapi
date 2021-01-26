/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import { relative } from "path";
import * as vscode from "vscode";
import { dirname } from "path";
import parser from "@xliic/json-schema-ref-parser";
import url from "@xliic/json-schema-ref-parser/lib/util/url";
import Pointer from "@xliic/json-schema-ref-parser/lib/pointer";
import $Ref from "@xliic/json-schema-ref-parser/lib/ref";
import { ResolverError } from "@xliic/json-schema-ref-parser/lib/util/errors";

import { parseJsonPointer, joinJsonPointer } from "./pointer";
import { Cache } from "./cache";
import { CacheEntry, MappingNode, Mapping, Bundle } from "./types";
import { clone } from "./util";
import { stat } from "fs";

const destinationMap = {
  v2: {
    parameters: ["parameters"],
    schema: ["definitions"],
    responses: ["responses"],
  },

  v3: {
    parameters: ["components", "parameters"],
    schema: ["components", "schemas"],
    responses: ["components", "responses"],
    examples: ["components", "examples"],
    requestBody: ["components", "requestBodies"],
    callbacks: ["components", "callbacks"],
    headers: ["components", "headers"],
    links: ["components", "links"],
  },
};

export function getOpenApiVersion(parsed: any): string {
  const swaggerVersionValue = parsed["swagger"];
  const openApiVersionValue = parsed["openapi"];

  if (swaggerVersionValue === "2.0") {
    return "v2";
  } else if (
    openApiVersionValue &&
    typeof openApiVersionValue === "string" &&
    openApiVersionValue.match(/^3\.0\.\d(-.+)?$/)
  ) {
    return "v3";
  }

  return null;
}

const resolver = (cache: Cache, documentUri: vscode.Uri) => {
  return {
    order: 10,
    canRead: (file) => {
      return true;
    },
    read: async (file) => {
      const uri = documentUri.with({ path: decodeURIComponent(file.url) });
      try {
        const document = await vscode.workspace.openTextDocument(uri);
        return cache.getDocumentValue(document);
      } catch (err) {
        throw new ResolverError(`Error opening file "${uri.fsPath}"`, uri.fsPath);
      }
    },
  };
};

export const cacheParser = {
  order: 100,
  canParse: [".yaml", ".yml", ".json", ".jsonc"],
  parse: ({ data, url, extension }: { data: CacheEntry; url: string; extension: string }) => {
    return new Promise((resolve, reject) => {
      resolve(clone(data));
    });
  },
};

function mangle(value: string) {
  return value.replace(/~/g, "-").replace(/\//g, "-").replace(/\#/g, "");
}

function set(target: any, path: string[], value: any) {
  const head = path.slice(0, -1);
  const last = path[path.length - 1];
  let current = target;
  for (const key of head) {
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  // check if the destination already exist
  if (current[last]) {
    throw new Error(`Unable to merge, object already exists at path: #/${path.join("/")}/${last}`);
  }
  current[last] = value;
}

export async function bundle(document: vscode.TextDocument, cache: Cache): Promise<Bundle> {
  const parsed = cache.getDocumentValue(document);
  const cwd = dirname(document.uri.fsPath) + "/";
  const state = {
    version: null,
    parsed: null,
    mapping: { value: null, children: {} },
    uris: new Set<string>([document.uri.toString()]),
  };

  const bundled = await parser.bundle(clone(parsed), {
    cwd,
    resolve: { http: false, file: resolver(cache, document.uri) },
    parse: {
      json: cacheParser,
      yaml: cacheParser,
    },
    continueOnError: true,
    hooks: {
      onParse: (parsed) => {
        state.parsed = parsed;
        state.version = getOpenApiVersion(parsed);
      },
      onRemap: (entry) => {
        const filename = url.toFileSystemPath(entry.file);
        const uri = document.uri.with({ path: decodeURIComponent(entry.file) }).toString();

        if (!state.uris.has(uri)) {
          state.uris.add(uri);
        }

        // FIXME implement remap for openapi v2 and $ref location based remap
        const hashPath = Pointer.parse(entry.hash);

        if (hashPath[0] == "components") {
          // TODO check that hashPath == 'schemas' or 'parameters', etc.
          const targetFileName = relative(cwd, filename);
          let path = ["components", hashPath[1], mangle(targetFileName) + "-" + hashPath[2]];
          if (hashPath.length > 3) {
            path = path.concat(hashPath.slice(3));
          }
          set(state.parsed, path, entry.value);
          insertMapping(state.mapping, path, { file: filename, hash: entry.hash });
          return Pointer.join("#", path);
        }

        const path = Pointer.parse(entry.pathFromRoot);
        const parentKey = path[path.length - 1];
        const grandparentKey = path[path.length - 2];
        const destinations = destinationMap[state.version];

        const destination = destinations[parentKey]
          ? destinations[parentKey]
          : destinations[grandparentKey]
          ? destinations[grandparentKey]
          : null;
        if (destination) {
          const ref = entry.$ref.$ref;
          const mangled = mangle(ref);
          const path = destination.concat([mangled]);
          set(state.parsed, path, entry.value);
          insertMapping(state.mapping, path, { file: filename, hash: entry.hash });
          return Pointer.join("#", path);
        }

        insertMapping(state.mapping, path, { file: filename, hash: entry.hash });
        entry.$ref = entry.parent[entry.key] = $Ref.dereference(entry.$ref, entry.value);
      },
    },
  });

  return {
    value: bundled,
    mapping: state.mapping,
    uris: state.uris,
  };
}

function insertMapping(root: MappingNode, path: string[], value: Mapping) {
  let current = root;
  for (const segment of path) {
    if (!current.children[segment]) {
      current.children[segment] = { value: null, children: {} };
    }
    current = current.children[segment];
  }
  // TODO check that current.value is empty
  current.value = value;
}

export function findMapping(root: MappingNode, pointer: string): Mapping {
  const path = parseJsonPointer(pointer);
  let current = root;
  let i = 0;
  for (; i < path.length && current.children[path[i]]; i++) {
    current = current.children[path[i]];
  }

  const { file, hash } = current.value;

  if (i < path.length) {
    const remaining = path.slice(i, path.length);
    return { file, hash: hash + joinJsonPointer(remaining) };
  }

  return { file, hash };
}
