import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Filter } from "../../icons";

export default function FilterButton({
  filters,
  onClick,
}: {
  filters: number;
  onClick: () => void;
}) {
  return (
    <Container
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      <Button>
        <span>Filter</span>
        <Filter />
        <Counter $visible={filters !== 0}>{filters}</Counter>
      </Button>
    </Container>
  );
}

const Container = styled.div``;

const Counter = styled.div<{ $visible: boolean }>`
  display: flex;
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  width: 16px;
  height: 16px;
  color: var(${ThemeColorVariables.buttonForeground});
  background-color: var(${ThemeColorVariables.buttonBackground});
  font-size: 12px;
`;

const Button = styled.button`
  display: flex;
  gap: 4px;
  align-items: center;
  cursor: pointer;
  background-color: transparent;
  color: var(${ThemeColorVariables.foreground});
  border: none;

  > span {
    flex: 1;
    font-weight: 700;
  }

  > svg {
    height: 16px;
    width: 16px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;
