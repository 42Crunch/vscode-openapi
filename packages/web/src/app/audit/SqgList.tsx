import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Sqg } from "@xliic/common/audit";

export default function SqgList({
  sqgs,
  selected,
  onSelect,
}: {
  sqgs: Sqg[];
  selected: string;
  onSelect: (index: number) => void;
}) {
  return (
    <Container>
      {sqgs.map((sqg, index) => (
        <Button
          key={sqg.id}
          selected={sqg.id === selected}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selected !== sqg.id) {
              onSelect(index);
            }
          }}
        >
          {sqg.name}
        </Button>
      ))}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
`;

const Button = styled.div<{ selected: boolean }>`
  display: flex;
  height: 28px;
  width: 100px;
  overflow: hidden;
  border-radius: 16px;
  margin-left: 4px;
  margin-right: 4px;
  border: 1px solid var(${ThemeColorVariables.errorBorder});

  color: var(${ThemeColorVariables.errorForeground});
  cursor: pointer;
  align-items: center;
  justify-content: center;
  ${({ selected }) =>
    selected
      ? `background-color: var(${ThemeColorVariables.computedTwo});`
      : `background-color: var(${ThemeColorVariables.computedOne});`}
`;
