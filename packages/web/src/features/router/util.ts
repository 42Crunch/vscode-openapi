import { Route } from "./RouterContext";
import { Path } from "./slice";

export function findRoute(routes: Route[], path: Path): Route | undefined {
  if (path.length === 0) {
    return undefined;
  }

  const [current, ...remaining] = path;

  for (const route of routes) {
    if (route.id === current) {
      if (remaining.length === 0) {
        // found
        return route;
      } else {
        if (route.children) {
          return findRoute(route.children, remaining);
        } else {
          // path is not exhausted but no children in the current route
          return undefined;
        }
      }
    }
  }
  return undefined;
}
