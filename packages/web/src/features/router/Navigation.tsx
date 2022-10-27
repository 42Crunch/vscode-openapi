import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { goTo } from "./slice";

import { RouterContext, Routes } from "./RouterContext";
import { useFeatureSelector, useFeatureDispatch } from "./slice";

export default function Navigation() {
  return (
    <RouterContext.Consumer>
      {(routes) => <InnerNavigation routes={routes} />}
    </RouterContext.Consumer>
  );
}

function InnerNavigation({ routes }: { routes: Routes }) {
  const dispatch = useFeatureDispatch();
  const current = useFeatureSelector((state) => state.router.current);

  const tabs = routes.map((route) => [route.id, route.title]);

  return (
    <NavigationContent>
      {tabs.map(([page, title]) => (
        <NavigationTab
          key={page}
          active={page === current[0]}
          onClick={() => dispatch(goTo([page]))}
        >
          <div>{title}</div>
        </NavigationTab>
      ))}
    </NavigationContent>
  );
}

const NavigationContent = styled.div`
  display: flex;
  margin-bottom: 1em;
  font-weight: 500;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  padding-left: 1em;
  padding-right: 1em;
`;

const NavigationTab = styled.div<{ active?: boolean }>`
  padding: 0 1em;
  ${(props) =>
    props.active
      ? `border-bottom: 3px solid var(${ThemeColorVariables.buttonBackground});`
      : `opacity: 0.7; border-bottom: 3px solid transparent; cursor: pointer;`};
  > div {
    padding: 0.125em;
    border: ${(props) =>
      props.active && ThemeColorVariables.contrastActiveBorder
        ? `1px solid var(${ThemeColorVariables.contrastActiveBorder})`
        : "none"};
  }
`;
