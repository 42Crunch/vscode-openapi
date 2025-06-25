import { JsonHigh } from "@xtao-org/jsonhilo";

export type HandlerFunction = (value: any, matches: any) => void;
export type ParserOptions = Record<string, HandlerFunction>;
export type Parser = {
  chunk(chunk: string): void;
  end(): unknown;
};

type OptionPath = string[];

type ParsedOption = {
  type: "deep" | "shallow" | "value";
  path: OptionPath;
  handler: HandlerFunction;
};

type Handlers =
  | {
      value?: HandlerFunction;
      shallow?: HandlerFunction;
      deep?: HandlerFunction;
      level: number;
      matches: unknown[];
    }
  | undefined;

function parseOptions(options: ParserOptions): ParsedOption[] {
  const result: ParsedOption[] = [];
  for (const [key, value] of Object.entries(options)) {
    const path = parsePath(key);
    const fname = path.pop();
    const type = fname === "deep()" ? "deep" : fname === "shallow()" ? "shallow" : "value";
    result.push({ path, type, handler: value });
  }
  // sort by path length, shorter paths first
  result.sort((a, b) => b.path.length - a.path.length);

  return result;
}

function parsePath(path: string): OptionPath {
  const parts = path.split(".");
  return parts;
}

export function makeParser(options: ParserOptions): Parser {
  const parsedOptions = parseOptions(options);
  return makeParser2(parsedOptions, []);
}

function checkPath(path: OptionPath, current: Array<string | number>): unknown[] | undefined {
  if (path.length !== current.length) {
    return undefined;
  }
  const matches: unknown[] = [];
  for (let i = 0; i < path.length; i++) {
    if (path[i] === current[i]) {
      continue;
    }

    if (path[i] === "*") {
      matches.push(current[i]);
      continue;
    }

    return undefined;
  }

  return matches;
}

function getHandlers(options: ParsedOption[], path: Array<string | number>): Handlers {
  for (const option of options) {
    const matches = checkPath(option.path, path);
    if (!matches) {
      continue;
    }

    return {
      value: option.type === "value" ? option.handler : undefined,
      shallow: option.type === "shallow" ? option.handler : undefined,
      deep: option.type === "deep" ? option.handler : undefined,
      matches,
      level: path.length,
    };
  }
}

function makeParser2(options: ParsedOption[], optionsStack: Array<ParsedOption | number>): Parser {
  const ancestors: Array<Record<string, unknown> | Array<unknown>> = [{}];
  const path: Array<string | number> = ["$"];

  let allHandlers: Handlers[] = [getHandlers(options, path)];

  const open = (type: "array" | "object") => () => {
    const handlers = getHandlers(options, path);
    if (handlers) {
      allHandlers.push(handlers);
    }

    if (type === "object") {
      ancestors.push({});
      path.push("");
    } else {
      ancestors.push([]);
      path.push(-1);
    }
  };

  const close = () => {
    path.pop();
    optionsStack.pop();

    const current = ancestors.pop()!;
    const parent = ancestors.at(-1)!;
    const key = path.at(-1)!;
    const handlers = allHandlers.at(-1);

    if (handlers?.level === path.length) {
      if (handlers.deep) {
        handlers.deep(current, handlers.matches);
      } else if (handlers.shallow) {
        handlers.shallow(current, handlers.matches);
      }
      allHandlers.pop();
    }

    if (handlers?.deep) {
      if (Array.isArray(parent)) {
        parent.push(current);
      } else {
        parent[key] = current;
      }
    }
  };

  const key = (k: string) => {
    path[path.length - 1] = k;
  };

  const value = (value: string | number | boolean | null) => {
    const handlers = allHandlers.at(-1);
    //console.log("value", value, path, handlers);
    if (handlers?.level === path.length - 1 && handlers.value) {
      handlers.value!(value, handlers.matches);
    } else if ((handlers?.level === path.length - 1 && handlers.shallow) || handlers?.deep) {
      const current = ancestors.at(-1)!;
      if (Array.isArray(current)) {
        current.push(value);
      } else {
        current![path.at(-1)!] = value;
      }
    }
  };

  return JsonHigh({
    openArray: open("array"),
    openObject: open("object"),
    closeArray: close,
    closeObject: close,
    key,
    value,
  });
}

export class Index {
  private contents: Map<string, number>;

  constructor() {
    this.contents = new Map<string, number>();
  }

  put(value: string): number {
    if (!this.contents.has(value)) {
      const index = this.contents.size;
      this.contents.set(value, index);
      return index;
    }
    return this.contents.get(value)!;
  }

  entries(): { id: number; value: string }[] {
    const objs = new Array(this.contents.size);
    for (const [value, id] of this.contents.entries()) {
      objs[id] = { id, value };
    }
    return objs;
  }
}

// For storing strings that arrive in a sorted order
export class IndexStore {
  private contents: Record<string, Map<string, number>> = {};

  constructor(buckets: string[]) {
    for (const bucket of buckets) {
      this.contents[bucket] = new Map<string, number>();
    }
  }

  put(bucket: string, value: string): number {
    if (!this.contents[bucket].has(value)) {
      const index = this.contents[bucket].size;
      this.contents[bucket].set(value, index);
      return index;
    }
    return this.contents[bucket].get(value)!;
  }

  getBuckets(): string[] {
    return Object.keys(this.contents);
  }

  entries(bucket: string): { id: number; value: string }[] {
    const objs = new Array(this.contents[bucket].size);
    for (const [value, id] of this.contents[bucket].entries()) {
      objs[id] = { id, value };
    }
    return objs;
  }
}

export type SortableIndexStoreIndex = { id: number };

// For storing strings that arrive out of order and have to be sorted, before persisting
export class SortableIndexStore {
  private contents: Record<string, Map<string, SortableIndexStoreIndex>> = {};

  constructor(buckets: readonly string[]) {
    for (const bucket of buckets) {
      this.contents[bucket] = new Map();
    }
  }

  put(bucket: string, value: string): SortableIndexStoreIndex {
    if (!this.contents[bucket].has(value)) {
      const index = { id: this.contents[bucket].size };
      this.contents[bucket].set(value, index);
      return index;
    }
    return this.contents[bucket].get(value)!;
  }

  get(bucket: string, value: string | undefined): SortableIndexStoreIndex | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.contents[bucket].get(value)!;
  }

  entries(bucket: string): { id: number; value: string }[] {
    const objs = new Array(this.contents[bucket].size);
    for (const [value, { id }] of this.contents[bucket].entries()) {
      objs[id] = { id, value };
    }
    return objs;
  }

  sort(name: string): void {
    const bucket = this.contents[name];
    const sorted = Array.from(bucket.keys()).sort();
    for (const [index, key] of sorted.entries()) {
      bucket.get(key)!.id = index;
    }
  }
}

// For storing objects with an auto-incrementing numeric IDs
// Can be trimmed to free up memory, preserving ID sequence so that
// new objects can continue to be added with the same ID sequence.
export class ObjectStore<T> {
  private counter: number = 0;
  private contents: { id: number; value: T }[] = [];

  put(value: T): number {
    const id = this.counter;
    this.contents.push({ id, value });
    this.counter++;
    return id;
  }

  objects(): { id: number; value: T }[] {
    return this.contents;
  }

  trim(): void {
    this.contents.length = 0;
  }
}

// For storing objects string primary keys that are stored SortableIndexStore
export class IndexedObjectStore<T> {
  private contents: { index: SortableIndexStoreIndex; value: T }[] = [];

  put(value: T, index: SortableIndexStoreIndex) {
    this.contents.push({ index, value });
  }

  objects(): { id: number; value: T }[] {
    return this.contents.map((item) => ({
      id: item.index.id,
      value: item.value,
    }));
  }
}
