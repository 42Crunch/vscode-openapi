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

  return (
    <NavigationContent>
      {routes.map(({ id, title }) => (
        <NavigationTab key={id} active={id === current[0]} onClick={() => dispatch(goTo([id]))}>
          {typeof title === "string" ? <div>{title}</div> : title}
        </NavigationTab>
      ))}
    </NavigationContent>
  );
}

const NavigationContent = styled.nav`
  height: 28px;
  display: flex;
  padding: 0px 16px;
  padding-top: 6px;
  gap: 24px;
  //font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
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
