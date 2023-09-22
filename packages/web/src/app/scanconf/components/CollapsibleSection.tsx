import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleUp, AngleDown } from "../../../icons";

export default function CollapsibleSection({
  isOpen,
  title,
  count,
  onClick,
  children,
}: {
  isOpen: boolean;
  title: string;
  count?: number;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
}) {
  return (
    <Container>
      <Header onClick={onClick}>
        {isOpen ? <AngleUp /> : <AngleDown />}
        <Title>
          {title}
          {!!count && <Counter>{count}</Counter>}
        </Title>
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
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  & > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Title = styled.div`
  display: flex;
  gap: 8px;
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
