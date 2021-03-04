/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";
import { dirname } from "path";
import parser from "@xliic/json-schema-ref-parser";
import Pointer from "@xliic/json-schema-ref-parser/lib/pointer";
import $Ref from "@xliic/json-schema-ref-parser/lib/ref";
import { ResolverError } from "@xliic/json-schema-ref-parser/lib/util/errors";

import { parseJsonPointer, joinJsonPointer } from "./pointer";
import { Cache } from "./cache";
import { MappingNode, Mapping, BundleResult, OpenApiVersion } from "./types";
import { simpleClone } from "./util";
import { ExternalRefDocumentProvider } from "./external-ref-provider";

const destinationMap = {
  [OpenApiVersion.V2]: {
    parameters: ["parameters"],
    schema: ["definitions"],
    responses: ["responses"],
  },

  [OpenApiVersion.V3]: {
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

const resolver = (
  cache: Cache,
  documentUri: vscode.Uri,
  approvedHosts: string[],
  externalRefProvider: ExternalRefDocumentProvider
) => {
  return {
    order: 10,
    canRead: (file) => {
      return true;
    },
    read: async (file) => {
      let uri: vscode.Uri = null;
      if (file.url.startsWith("http:") || file.url.startsWith("https:")) {
        const origUri = vscode.Uri.parse(file.url);
        const hostname = origUri.authority;
        const approved = approvedHosts.some(
          (approvedHostname) => approvedHostname.toLowerCase() === hostname.toLowerCase()
        );
        if (approved) {
          if (origUri.scheme === "http") {
            uri = origUri.with({ scheme: "openapi-external-http" });
          } else {
            uri = origUri.with({ scheme: "openapi-external-https" });
          }
        } else {
          throw new ResolverError(
            {
              message: `Failed to resolve external reference, "${hostname}" is not in the list of approved hostnames.`,
              code: `rejected:${hostname}`,
            },
            origUri.fsPath
          );
        }
      } else {
        try {
          uri = documentUri.with({ path: decodeURIComponent(file.url) });
        } catch (err) {
          throw new ResolverError({
            message: `Failed to decode URL "${file.url}: ${err.message}"`,
          });
        }
      }
      try {
        const cached = await cache.getExistingDocumentValueByUri(uri);
        if (cached) {
          return cached;
        }

        const document = await vscode.workspace.openTextDocument(uri);
        if (uri.scheme === "openapi-external-http" || uri.scheme === "openapi-external-https") {
          const languageId = externalRefProvider.getLanguageId(uri);
          if (languageId) {
            await vscode.languages.setTextDocumentLanguage(document, languageId);
          }
        }
        return await cache.getDocumentValue(document);
      } catch (err) {
        throw new ResolverError(
          { message: `Error reading file "${uri.fsPath}: ${err.message}"` },
          uri.fsPath
        );
      }
    },
  };
};

export const cacheParser = {
  order: 100,
  canParse: [".yaml", ".yml", ".json", ".jsonc"],
  parse: ({ data, url, extension }: { data: any; url: string; extension: string }) => {
    return new Promise((resolve, reject) => {
      resolve(simpleClone(data));
    });
  },
};

function mangle(value: string) {
  return value.replace(/[~\/\#:%]/g, "-");
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

function refToCanonicalUri(baseUri: vscode.Uri, ref: string): vscode.Uri {
  if (ref.startsWith("http:") || ref.startsWith("https:")) {
    return vscode.Uri.parse(ref.replace("http", "openapi-external-http"));
  }

  return baseUri.with({ path: decodeURIComponent(ref) });
}

function hooks(document: vscode.TextDocument, cwd: string, state: any) {
  return {
    onRemap: (entry) => {
      const uri = refToCanonicalUri(document.uri, entry.file).toString();

      if (!state.uris.has(uri)) {
        state.uris.add(uri);
      }

      // FIXME implement remap for openapi v2 and $ref location based remap
      const hashPath = Pointer.parse(entry.hash);

      if (hashPath[0] == "components" && hashPath.length >= 3) {
        // TODO check that hashPath == 'schemas' or 'parameters', etc.
        let path = ["components", hashPath[1], mangle(uri) + "-" + hashPath[2]];
        if (hashPath.length > 3) {
          path = path.concat(hashPath.slice(3));
        }
        set(state.parsed, path, entry.value);
        insertMapping(state.mapping, path, { uri, hash: entry.hash });
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
        insertMapping(state.mapping, path, { uri, hash: entry.hash });
        return Pointer.join("#", path);
      }

      insertMapping(state.mapping, path, { uri, hash: entry.hash });
      entry.$ref = entry.parent[entry.key] = $Ref.dereference(entry.$ref, entry.value);
    },
  };
}

export async function bundle(
  document: vscode.TextDocument,
  version: OpenApiVersion,
  parsed: any,
  cache: Cache,
  approvedHosts: string[],
  externalRefProvider: ExternalRefDocumentProvider
): Promise<BundleResult> {
  const cwd = dirname(document.uri.fsPath) + "/";
  const cloned = simpleClone(parsed);

  const state = {
    version,
    parsed: cloned,
    mapping: { value: null, children: {} },
    uris: new Set<string>([document.uri.toString()]),
  };

  try {
    const bundled = await parser.bundle(cloned, {
      cwd,
      resolve: {
        file: resolver(cache, document.uri, approvedHosts, externalRefProvider),
      },
      parse: {
        json: cacheParser,
        yaml: cacheParser,
      },
      continueOnError: true,
      hooks: hooks(document, cwd, state),
    });

    return {
      value: bundled,
      mapping: state.mapping,
      uris: state.uris,
    };
  } catch (errors) {
    return { errors };
  }
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

  const { uri, hash } = current.value;

  if (i < path.length) {
    const remaining = path.slice(i, path.length);
    return { uri, hash: hash + joinJsonPointer(remaining) };
  }

  return { uri, hash };
}
