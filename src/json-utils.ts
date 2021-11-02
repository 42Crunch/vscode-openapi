import { getType } from "./audit/schema";
import { Container, Location, Parsed } from "@xliic/preserving-json-yaml-parser/lib/types";
import { getPreservedLocation } from "@xliic/preserving-json-yaml-parser/lib/preserve";
import { find } from "@xliic/preserving-json-yaml-parser";
import { getPointerChild, getPointerLastSegment, getPointerParent } from "./pointer";

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
      return null;
    }
    return children[0];
  }

  public getLastChild() {
    const children = this.getChildren(true);
    if (children.length === 0) {
      return null;
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

  public getParent(root: Parsed): JsonNodeValue {
    if (this.pointer !== "") {
      const parentPointer = getPointerParent(this.pointer);
      return new JsonNodeValue(find(root, parentPointer), parentPointer);
    }
    return null;
  }

  public getRange(root: Parsed): [number, number] {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    for (const key of Object.keys(parent.value)) {
      if (key === myKey && this.value === parent.value[key]) {
        const container = parent.value as Container;
        const loc = getPreservedLocation(container, key);
        return [loc.key ? loc.key.start : loc.value.start, loc.value.end];
      }
    }
    return null;
  }

  public getKeyRange(root: Parsed): [number, number] {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    for (const key of Object.keys(parent.value)) {
      if (key === myKey && this.value === parent.value[key]) {
        const container = parent.value as Container;
        const loc = getPreservedLocation(container, key);
        return loc.key ? [loc.key.start, loc.key.end] : null;
      }
    }
    return null;
  }

  public getValueRange(root: Parsed): [number, number] {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    for (const key of Object.keys(parent.value)) {
      if (key === myKey && this.value === parent.value[key]) {
        const container = parent.value as Container;
        const loc = getPreservedLocation(container, key);
        return [loc.value.start, loc.value.end];
      }
    }
    return null;
  }

  public next(root: Parsed): JsonNodeValue {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    const keys = getKeys(parent.value, true);
    for (let i = 0; i < keys.length - 1; i++) {
      if (myKey === keys[i] && this.value === parent.value[keys[i]]) {
        return new JsonNodeValue(
          parent.value[keys[i + 1]],
          getPointerChild(parent.pointer, keys[i + 1])
        );
      }
    }
    return null;
  }

  public prev(root: Parsed): JsonNodeValue {
    const myKey = this.getKey();
    const parent = this.getParent(root);
    const keys = getKeys(parent.value, true);
    for (let i = 1; i < keys.length; i++) {
      if (myKey === keys[i] && this.value === parent.value[keys[i]]) {
        return new JsonNodeValue(
          parent.value[keys[i - 1]],
          getPointerChild(parent.pointer, keys[i - 1])
        );
      }
    }
    return null;
  }
}

export function getRootAsJsonNodeValue(root: Parsed): JsonNodeValue {
  return root ? new JsonNodeValue(root, "") : null;
}

export function findJsonNodeValue(root: Parsed, pointer: string): JsonNodeValue {
  const value = find(root, pointer);
  return value === undefined ? null : new JsonNodeValue(value, pointer);
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
    return (
      getOffset(getPreservedLocation(container, key1)) -
      getOffset(getPreservedLocation(container, key2))
    );
  };
}

function getOffset(location: Location): number {
  return location.key ? location.key.start : location.value.start;
}
