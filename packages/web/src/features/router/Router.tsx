import { Route, RouterContext, Routes } from "./RouterContext";
import { Path, useFeatureSelector } from "./slice";

export default function Router() {
  return (
    <RouterContext.Consumer>{(routes) => <InnerRouter routes={routes} />}</RouterContext.Consumer>
  );
}

function InnerRouter({ routes }: { routes: Routes }) {
  const current = useFeatureSelector((state) => state.router.current);
  const route = findRoute(routes, current);
  if (!route) {
    return <div />;
  }
  return route.element;
}

function findRoute(routes: Routes, path: Path): Route | undefined {
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
