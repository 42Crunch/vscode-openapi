/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";
import parser from "@xliic/json-schema-ref-parser";
import Pointer from "@xliic/json-schema-ref-parser/lib/pointer";
import $Ref from "@xliic/json-schema-ref-parser/lib/ref";
import { ResolverError } from "@xliic/json-schema-ref-parser/lib/util/errors";

import { parseJsonPointer, joinJsonPointer } from "./pointer";
import {
  MappingNode,
  Mapping,
  BundleResult,
  OpenApiVersion,
  BundlingError,
  DocumentToObjectParser,
} from "./types";
import { toInternalUri, requiresApproval, ExternalRefDocumentProvider } from "./external-refs";
import { simpleClone } from '@xliic/preserving-json-yaml-parser';

interface BundlerState {
  version: OpenApiVersion;
  parsed: any;
  mapping: MappingNode;
  documents: Set<vscode.TextDocument>;
}

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

function refToUri(ref: string) {
  try {
    const uri = vscode.Uri.parse(ref, true);
    return toInternalUri(uri);
  } catch (err) {
    throw new ResolverError({
      message: `Failed to decode $ref: "${ref}: ${err.message}"`,
    });
  }
}

function checkApproval(approvedHosts: string[], uri: vscode.Uri): void {
  if (requiresApproval(uri)) {
    const host = uri.authority;
    const approved = approvedHosts.some(
      (approvedHostname) => approvedHostname.toLowerCase() === host.toLowerCase()
    );

    if (!approved) {
      throw new ResolverError(
        {
          message: `Failed to resolve external reference, "${host}" is not in the list of approved hosts.`,
          code: `rejected:${host}`,
        },
        uri.fsPath
      );
    }
  }
}

const resolver = (
  documentParser: DocumentToObjectParser,
  state: BundlerState,
  approvedHosts: string[],
  externalRefProvider: ExternalRefDocumentProvider
) => {
  return {
    order: 10,
    canRead: (file) => {
      return true;
    },
    read: async (file) => {
      // file.url is already resolved uri, provided by json-schema-ref-parser
      const uri = refToUri(file.url);

      checkApproval(approvedHosts, uri);

      try {
        const document = await vscode.workspace.openTextDocument(uri);
        const languageId = externalRefProvider.getLanguageId(uri);
        if (languageId) {
          await vscode.languages.setTextDocumentLanguage(document, languageId);
        }
        state.documents.add(document);
        return documentParser(document);
      } catch (err) {
        throw new ResolverError(
          { message: `Error reading file "${file.url}: ${err.message}"` },
          file.url
        );
      }
    },
  };
};

export const cacheParser = {
  order: 100,
  canParse: true,
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

function hooks(document: vscode.TextDocument, state: BundlerState) {
  return {
    onRemap: (entry) => {
      const uri = toInternalUri(vscode.Uri.parse(entry.file)).toString();
      const hashPath = Pointer.parse(entry.hash);

      if (hashPath[0] == "components" && hashPath.length >= 3) {
        // TODO check that hashPath == 'schemas' or 'parameters', etc.
        let path = ["components", hashPath[1], mangle(entry.file) + "-" + hashPath[2]];
        if (hashPath.length > 3) {
          path = path.concat(hashPath.slice(3));
        }
        set(state.parsed, path, entry.value);
        insertMapping(state.mapping, path, { uri, hash: entry.hash });
        return Pointer.join("#", path);
      } else if (
        (hashPath[0] === "parameters" ||
          hashPath[0] === "definitions" ||
          hashPath[0] === "responses") &&
        hashPath.length >= 2
      ) {
        let path = [hashPath[0], mangle(entry.file) + "-" + hashPath[1]];
        if (hashPath.length > 2) {
          path = path.concat(hashPath.slice(2));
        }
        set(state.parsed, path, entry.value);
        insertMapping(state.mapping, path, { uri, hash: entry.hash });
        return Pointer.join("#", path);
      }

      const path = Pointer.parse(entry.pathFromRoot);
      if (state.version !== OpenApiVersion.Unknown) {
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
  documentParser: DocumentToObjectParser,
  approvedHosts: string[],
  externalRefProvider: ExternalRefDocumentProvider
): Promise<BundleResult> {
  const cloned = simpleClone(parsed);

  const state: BundlerState = {
    version,
    parsed: cloned,
    mapping: { value: { uri: document.uri.toString(), hash: null }, children: {} },
    documents: new Set<vscode.TextDocument>(),
  };

  try {
    const bundled = await parser.bundle(cloned, {
      cwd: document.uri.toString(),
      resolve: {
        file: resolver(documentParser, state, approvedHosts, externalRefProvider),
        http: false, // disable built in http resolver
      },
      parse: {
        json: cacheParser,
        yaml: cacheParser,
      },
      continueOnError: true,
      hooks: hooks(document, state),
    });

    return {
      document,
      value: bundled,
      mapping: state.mapping,
      documents: state.documents,
    };
  } catch (errors) {
    if (!errors.errors) {
      throw new Error(`Unexpected exception while bundling: ${errors}`);
    }
    return {
      errors: processErrors(errors.errors),
      document,
      documents: state.documents,
    };
  }
}

function processErrors(errors: any[]): Map<string, [BundlingError]> {
  const result = new Map();
  for (const error of errors) {
    if (!error?.path?.length) {
      // skip no path and zero length path
      continue;
    }

    if (!result.has(error.source)) {
      result.set(error.source, []);
    }

    const errors = result.get(error.source);

    const bundlingError: BundlingError = {
      pointer: joinJsonPointer([...error.path, "$ref"]),
      message: error.message,
      code: error.code,
    };

    if (error.code === "ERESOLVER" && error?.ioErrorCode?.startsWith("rejected:")) {
      bundlingError.rejectedHost = error.ioErrorCode.substring("rejected:".length);
    }

    errors.push(bundlingError);
  }

  return result;
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

  if (hash) {
    if (i < path.length) {
      const remaining = path.slice(i, path.length);
      return { uri, hash: hash + joinJsonPointer(remaining) };
    }
  }

  return { uri, hash };
}
