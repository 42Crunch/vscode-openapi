import { getType } from "./audit/schema";
import { Container, Location, Parsed, getLocation } from "@xliic/preserving-json-yaml-parser";
import { find, parse } from "@xliic/preserving-json-yaml-parser";
import { getPointerChild, getPointerLastSegment, getPointerParent } from "./pointer";
import { parserOptions } from "./parser-options";
import { getPreservedRootRange } from "@xliic/preserving-json-yaml-parser/lib/preserve";

export type Range = [number, number]; // start, end

export interface Replacement {
  pointer: string;
  value: string;
  replaceKey?: boolean;
}

interface TextReplacement {
  range: Range;
  value: string;
}

export class JsonNodeValue {
  readonly value: any;
  readonly pointer: string;

  constructor(value: any, pointer: string) {
    this.value = value;
    this.pointer = pointer;
  }

  public getDepth(): number {
    return this.pointer === "" ? 0 : this.pointer.split("/").length - 1;
  }

  public getKey(): string {
    return getPointerLastSegment(this.pointer);
  }

  public getValue(): string {
    return this.value;
  }

  public getRawValue(): string {
    return this.getValue();
  }

  public getChildren(keepOrder?: boolean): JsonNodeValue[] {
    const children = [];
    for (const key of getKeys(this.value, keepOrder)) {
      children.push(new JsonNodeValue(this.value[key], getPointerChild(this.pointer, key)));
    }
    return children;
  }

  public getFirstChild() {
    const children = this.getChildren(true);
    if (children.length === 0) {
      return undefined;
    }
    return children[0];
  }

  public getLastChild() {
    const children = this.getChildren(true);
    if (children.length === 0) {
      return undefined;
    }
    return children[children.length - 1];
  }

  public isObject(): boolean {
    return getType(this.value) === "object";
  }

  public isArray(): boolean {
    return getType(this.value) === "array";
  }

  public isScalar(): boolean {
    return !this.isObject() && !this.isArray();
  }

  public getParent(root: Parsed): JsonNodeValue | undefined {
    if (this.pointer !== "") {
      const parentPointer = getPointerParent(this.pointer);
      return new JsonNodeValue(find(root, parentPointer), parentPointer);
    }
    return undefined;
  }

  public getRange(root: Parsed): [number, number] | undefined {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    if (parent) {
      for (const key of Object.keys(parent.value)) {
        if (key === myKey && this.value === parent.value[key]) {
          const container = parent.value as Container;
          const loc = getLocation(container, key);
          if (loc) {
            return [loc.key ? loc.key.start : loc.value.start, loc.value.end];
          } else {
            return undefined;
          }
        }
      }
    } else if (this.pointer === "") {
      const range = getPreservedRootRange(root);
      return [range.start, range.end];
    }
    return undefined;
  }

  public getKeyRange(root: Parsed): [number, number] | undefined {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    if (parent) {
      for (const key of Object.keys(parent.value)) {
        if (key === myKey && this.value === parent.value[key]) {
          const container = parent.value as Container;
          const loc = getLocation(container, key);
          if (loc) {
            return loc.key ? [loc.key.start, loc.key.end] : undefined;
          } else {
            return undefined;
          }
        }
      }
    }
    return undefined;
  }

  public getValueRange(root: Parsed): [number, number] | undefined {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    if (parent) {
      for (const key of Object.keys(parent.value)) {
        if (key === myKey && this.value === parent.value[key]) {
          const container = parent.value as Container;
          const loc = getLocation(container, key);
          if (loc) {
            return [loc.value.start, loc.value.end];
          } else {
            return undefined;
          }
        }
      }
    }
    return undefined;
  }

  public next(root: Parsed): JsonNodeValue | undefined {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    if (parent) {
      const keys = getKeys(parent.value, true);
      for (let i = 0; i < keys.length - 1; i++) {
        if (myKey === keys[i] && this.value === parent.value[keys[i]]) {
          return new JsonNodeValue(
            parent.value[keys[i + 1]],
            getPointerChild(parent.pointer, keys[i + 1])
          );
        }
      }
    }
    return undefined;
  }

  public prev(root: Parsed): JsonNodeValue | undefined {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    if (parent) {
      const keys = getKeys(parent.value, true);
      for (let i = 1; i < keys.length; i++) {
        if (myKey === keys[i] && this.value === parent.value[keys[i]]) {
          return new JsonNodeValue(
            parent.value[keys[i - 1]],
            getPointerChild(parent.pointer, keys[i - 1])
          );
        }
      }
    }
    return undefined;
  }
}

export function getRootAsJsonNodeValue(root: Parsed): JsonNodeValue | undefined {
  return root ? new JsonNodeValue(root, "") : undefined;
}

export function findJsonNodeValue(root: Parsed, pointer: string): JsonNodeValue | undefined {
  const value = find(root, pointer);
  return value === undefined ? undefined : new JsonNodeValue(value, pointer);
}

function getKeys(value: any, keepOrder?: boolean): any[] {
  const keys = Object.keys(value);
  if (keepOrder && keys.length > 1) {
    keys.sort(comparator(value as Container));
  }
  return keys;
}

function comparator(container: Container) {
  return function (key1: string | number, key2: string | number) {
    return getOffset(getLocation(container, key1)!) - getOffset(getLocation(container, key2)!);
  };
}

function getOffset(location: Location): number {
  return location.key ? location.key.start : location.value.start;
}

function substrings(string: string, ranges: Range[]): string[] {
  const result: string[] = [];
  let position = 0;
  for (const [start, end] of ranges) {
    const before = string.substring(position, start);
    const inside = string.substring(start, end);
    position = end;
    result.push(before);
    result.push(inside);
  }
  result.push(string.substring(position));

  return result;
}

function replaceTextRanges(text: string, replacements: TextReplacement[]): string {
  const sorted = replacements.sort((a, b) => a.range[0] - b.range[0]);
  const ranges = sorted.map((replacement) => replacement.range);
  const chunks = substrings(text, ranges);

  for (let i = 0; i < sorted.length; i++) {
    let replacement = sorted[i].value;
    const target = i * 2 + 1;
    const original = chunks[target];
    let quote = "";
    if (original.startsWith(`"`) && original.endsWith(`"`)) {
      quote = `"`;
    } else if (original.startsWith(`'`) && original.endsWith(`'`)) {
      quote = `'`;
    }

    chunks[target] = `${quote}${replacement}${quote}`;
  }

  return chunks.join("");
}

export function replace(text: string, languageId: string, replacements: Replacement[]) {
  const [root, errors] = parse(text, languageId, parserOptions);
  if (errors.length || root === undefined) {
    throw new Error(`Unable to parse text to perform replacement in JSON/YAML in: ${text}`);
  }

  const textReplacements: TextReplacement[] = replacements.map((replacement) => {
    const target = findJsonNodeValue(root, replacement.pointer)!;
    const range = replacement.replaceKey ? target.getKeyRange(root) : target.getValueRange(root);
    return { range: range!, value: replacement.value };
  });

  return replaceTextRanges(text, textReplacements);
}
