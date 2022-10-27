import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import Pen from "../icons/Pen";

export default function Section({
  children,
  title,
  collapsed,
  onExpand,
}: {
  children?: React.ReactNode;
  title: string;
  collapsed: boolean;
  onExpand: () => void;
}) {
  if (collapsed) {
    return (
      <Container collapsed={collapsed} onClick={onExpand}>
        <div>{title}</div>
        <div>
          <Pen />
        </div>
      </Container>
    );
  }
  return <Container collapsed={collapsed}>{children}</Container>;
}

const Container = styled.div`
  ${({ collapsed }: { collapsed: boolean }) =>
    collapsed &&
    `
    display: flex;
    padding: 8px;
    margin: 8px;
    cursor: pointer;
    border: 1px solid var(${ThemeColorVariables.border});
    &:hover {
      background-color: var(${ThemeColorVariables.dropdownBackground});
    }
  `}

  & > :first-child {
    flex: 1;
  }

  & > div:last-child > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;
