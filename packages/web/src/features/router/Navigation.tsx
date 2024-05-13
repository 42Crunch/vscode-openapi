import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { goTo, openLink } from "./slice";

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
  // navigation is only for the first two levels
  const current = useFeatureSelector((state) => state.router.current);
  const top = current.slice(0, 2);
  const gotoPrefix = top.slice(0, 1);
  const menuRoutes = top.length > 1 ? routes.find((r) => r.id === top[0])?.children : routes;
  const route = menuRoutes?.find((r) => r.id === top[top.length - 1]);

  if (!menuRoutes) {
    return null;
  }

  if (route?.navigation === false) {
    if (route.title !== "") {
      return (
        <TitleContent>
          <Title>{route.title}</Title>
        </TitleContent>
      );
    }
    return null;
  }

  return (
    <NavigationContent>
      {menuRoutes.map(({ id, title, link }) => (
        <NavigationTab
          key={id}
          active={id === top[top.length - 1]}
          onClick={() => {
            if (link) {
              dispatch(openLink(link));
            } else {
              dispatch(goTo([...gotoPrefix, id]));
            }
          }}
        >
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
  justify-content: space-between;
  font-size: 14px;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
`;

const TitleContent = styled.div`
  height: 35px;
  display: flex;
  padding: 0px 16px;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
`;

const NavigationTab = styled.div<{ active?: boolean }>`
  padding: 0 1em;
  display: flex;
  align-items: center;
  ${(props) =>
    props.active
      ? `border-bottom: 3px solid var(${ThemeColorVariables.buttonBackground});`
      : `opacity: 0.7; border-bottom: 3px solid transparent; cursor: pointer;`};
  > div {
    border: ${(props) =>
      props.active && ThemeColorVariables.contrastActiveBorder
        ? `1px solid var(${ThemeColorVariables.contrastActiveBorder})`
        : "none"};
  }
`;

const Title = styled.div`
  place-self: center;
  font-size: 16px;
  font-weight: 500;
  display: flex;
`;
