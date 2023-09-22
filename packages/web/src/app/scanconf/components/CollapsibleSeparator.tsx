import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleUp, AngleDown } from "../../../icons";

export default function CollapsibleSeparator({
  isOpen,
  title,
  onClick,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
}) {
  return (
    <Container onClick={onClick}>
      {isOpen ? <AngleUp /> : <AngleDown />}
      <div>{title}</div>
      <hr />
      {children}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  padding: 8px;
  gap: 8px;
  cursor: pointer;
  align-items: center;

  & > svg {
    fill: var(${ThemeColorVariables.foreground});
  }

  & > hr {
    flex: 1;
    border: none;
    border-top: 1px solid var(${ThemeColorVariables.border});
  }
`;
