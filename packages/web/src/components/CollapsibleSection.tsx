import { ReactNode, useState } from "react";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleDown, AngleUp } from "../icons";

// TODO get rid of this file? There is saame collapsible section elsewhere
export default function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Container>
      <Title collapsed={collapsed} onClick={() => setCollapsed(!collapsed)}>
        <div>{collapsed ? <AngleDown /> : <AngleUp />}</div>
        <div>
          <TopDescription>{title}</TopDescription>
        </div>
      </Title>
      {!collapsed && <Content>{children}</Content>}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  border: 1px solid var(${ThemeColorVariables.border});
`;

const Title = styled.div`
  display: flex;
  cursor: pointer;
  padding: 10px 10px 10px 0px;
  background-color: var(${ThemeColorVariables.computedOne});
  & > div:first-child {
    padding-left: 4px;
    padding-right: 8px;
    > svg {
      fill: var(${ThemeColorVariables.foreground});
    }
  }
  border-left: 5px solid transparent;
  ${({ collapsed }: { collapsed: boolean }) =>
    !collapsed &&
    `border-bottom: 1px solid var(${ThemeColorVariables.border});
    border-left: 5px solid var(${ThemeColorVariables.badgeBackground});`}
`;

export const TopDescription = styled.div`
  font-weight: 600;
`;

export const BottomDescription = styled.div`
  margin-top: 8px;
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
  background-color: var(${ThemeColorVariables.computedOne});
  //border-left: 5px solid var(${ThemeColorVariables.badgeBackground});
`;
