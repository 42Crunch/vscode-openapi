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
        <Filter />
        {filters !== 0 && <Counter>{filters}</Counter>}
      </Button>
    </Container>
  );
}

const Container = styled.div`
  width: 34px;
  height: 26px;
  position: relative;
`;

const Counter = styled.div`
  position: absolute;
  left: 18px;
  top: 10px;
  display: flex;
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
  align-items: center;
  cursor: pointer;
  background-color: transparent;
  color: var(${ThemeColorVariables.buttonForeground});
  border: none;
  ${({ waiting }: { disabled?: boolean; waiting?: boolean }) => waiting && "gap: 8px;"}

  > span {
    flex: 1;
  }
  > svg {
    height: 16px;
    width: 16px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;
