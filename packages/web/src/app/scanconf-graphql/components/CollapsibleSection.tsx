import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleUp, AngleDown } from "../../../icons";
import type { SetRequired } from "type-fest";
import { useState } from "react";

type CollapsibleSectionProps = {
  title: string | React.ReactNode;
  count?: number;
  isOpen?: boolean;
  setOpen?: (open: boolean) => void;
  defaultOpen?: boolean;
  menu?: React.ReactNode;
  children?: React.ReactNode;
};

export default function CollapsibleSection({ isOpen, setOpen, ...rest }: CollapsibleSectionProps) {
  if (setOpen !== undefined && isOpen !== undefined) {
    return ControlledCollapsibleSection({ ...rest, isOpen, setOpen });
  } else {
    return UncontrolledCollapsibleSection({ ...rest });
  }
}

export function UncontrolledCollapsibleSection({
  defaultOpen,
  ...rest
}: Omit<CollapsibleSectionProps, "setOpen" | "isOpen">) {
  const [isOpen, setOpen] = useState(defaultOpen !== undefined ? defaultOpen : true);

  return ControlledCollapsibleSection({ ...rest, isOpen, setOpen });
}

export function ControlledCollapsibleSection({
  isOpen,
  setOpen,
  title,
  count,
  menu,
  children,
}: SetRequired<Omit<CollapsibleSectionProps, "defaultOpen">, "setOpen" | "isOpen">) {
  return (
    <Container>
      <Header
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!isOpen);
        }}
      >
        {isOpen ? <AngleUp /> : <AngleDown />}
        <Description>
          {typeof title === "string" ? <Title>{title}</Title> : title}
          {!!count && <Counter>{count}</Counter>}
          {menu && <Menu>{menu}</Menu>}
        </Description>
      </Header>
      {isOpen && (
        <Content>
          <Bar />
          <div>{children}</div>
        </Content>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`;

const Header = styled.div`
  display: flex;
  cursor: pointer;
  flex-direction: row;
  gap: 8px;
  align-items: center;

  margin-bottom: 8px;
  & > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
  .menu,
  button {
    opacity: 0;
  }
  &:hover {
    .menu,
    button {
      opacity: 1;
    }
  }
`;

const Description = styled.div`
  flex: 1;
  display: flex;
  gap: 8px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const Menu = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const Content = styled.div`
  display: flex;
  flex-direction: row;
  > div:last-child {
    flex: 1;
    margin-left: 8px;
  }
`;

const Bar = styled.div`
  width: 2px;
  background-color: var(${ThemeColorVariables.border});
  margin: 0px 6px;
`;

const Counter = styled.span`
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  padding: 2px 4px;
`;
