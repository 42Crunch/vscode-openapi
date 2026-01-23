import { GraphQlFinder } from "./finder";
import { ARGUMENT_PATTERN, GraphQlLocator } from "./locator";

export class GraphQlHandler {
  private readonly finder: GraphQlFinder;
  private static readonly LOCATOR: GraphQlLocator = new GraphQlLocator();

  constructor(reg: any) {
    this.finder = new GraphQlFinder(reg);
  }

  public getPosition(pointer: string): any | null {
    if (!pointer) {
      return null;
    }
    const segments: string[] = splitPointer(pointer);
    if (segments.length === 0) {
      return null;
    }
    let parent: any = null;
    for (const segment of segments) {
      parent = this.finder.findTarget(parent, getCleanValue(segment));
      if (!parent) {
        return null;
      }
    }
    return GraphQlHandler.LOCATOR.getPosition(parent, segments[segments.length - 1]);
  }
}

function splitPointer(pointer: string): string[] {
  if (ARGUMENT_PATTERN.test(pointer)) {
    // Query.viewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)
    // ["Query", "viewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)"]
    const lastParenIndex: number = pointer.lastIndexOf("(");
    const beforeBr: string = pointer.substring(0, lastParenIndex);
    const afterBr: string = pointer.substring(lastParenIndex);
    const items: string[] = beforeBr.split(".");
    items[items.length - 1] = items[items.length - 1] + afterBr;
    return items;
  } else {
    // Query.TweetsMeta().Meta.count: Int
    // ["Query", "TweetsMeta()", "Meta", "count: Int"]
    return pointer.split(".");
  }
}

function getCleanValue(value: string): string {
  for (let i = 0; i < value.length; i++) {
    const c: string = value.charAt(i);
    if (c === "(" || c === "[" || c === ":") {
      return value.substring(0, i);
    }
  }
  return value;
}
