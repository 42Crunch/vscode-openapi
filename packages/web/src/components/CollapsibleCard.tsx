import { ReactNode, useState } from "react";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleDown, AngleUp } from "../icons";

export default function CollapsibleCard({
  children,
  defaultCollapsed,
}: {
  defaultCollapsed?: boolean;
  children: [...ReactNode[], ReactNode];
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? true);

  const head = children.slice(0, children.length - 1);
  const body = children[children.length - 1];

  return (
    <Container>
      <Title
        collapsed={collapsed}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCollapsed(!collapsed);
        }}
      >
        <div>{collapsed ? <AngleDown /> : <AngleUp />}</div>
        <div>{...head}</div>
      </Title>
      {!collapsed && <Content>{body}</Content>}
    </Container>
  );
}

//margin: ${({ noMargin }: { noMargin: boolean | undefined }) => (noMargin ? "0" : "8px")};
const Container = styled.div`
  margin: 8px;
  border: 1px solid var(${ThemeColorVariables.border});
  //background-color: var(${ThemeColorVariables.computedOne});
`;

const Title = styled.div`
  display: flex;
  cursor: pointer;
  padding: 10px 10px 10px 0px;
  //background-color: var(${ThemeColorVariables.computedOne});
  align-items: stretch;
  & > div:first-child {
    padding-left: 4px;
    padding-right: 8px;
    display: flex;
    justify-content: center;
    > svg {
      fill: var(${ThemeColorVariables.foreground});
    }
  }
  & > div:nth-child(2) {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  & > div:nth-child(3) {
    display: flex;
    align-items: center;
  }

  border-left: 5px solid transparent;
  ${({ collapsed }: { collapsed: boolean }) =>
    !collapsed &&
    `border-bottom: 1px solid var(${ThemeColorVariables.border});
    border-left: 5px solid var(${ThemeColorVariables.badgeBackground});`}
`;

export const TopDescription = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-weight: 600;
`;

export const BottomDescription = styled.div`
  //margin-top: 8px;
  display: flex;
  font-size: 90%;
  align-items: center;
  gap: 16px;
`;

export const BottomItem = styled.div`
  display: flex;
  align-items: center;
  opacity: 0.8;
  & > svg {
    margin-right: 4px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Content = styled.div`
  //background-color: var(${ThemeColorVariables.computedOne});
`;
