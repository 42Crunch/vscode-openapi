import { RouterContext, Routes } from "./RouterContext";
import { findRoute } from "./util";
import { useFeatureSelector } from "./slice";

export default function Router() {
  return (
    <RouterContext.Consumer>{(routes) => <InnerRouter routes={routes} />}</RouterContext.Consumer>
  );
}

function InnerRouter({ routes }: { routes: Routes }) {
  const current = useFeatureSelector((state) => state.router.current);
  const route = findRoute(routes, current);
  if (!route || route.link) {
    return <div />;
  }

  return route.element;
}
