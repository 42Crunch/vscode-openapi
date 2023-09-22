import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function Switch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Container
      active={value}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(!value);
      }}
    >
      <Handle active={value} />
    </Container>
  );
}

const Container = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 34px;
  height: 17px;
  border-radius: 30px;
  border: 1px solid var(${ThemeColorVariables.border});
  ${({ active }) =>
    active
      ? `background-color: var(${ThemeColorVariables.buttonBackground}); justify-content: end;`
      : `background-color: var(${ThemeColorVariables.background}); justify-content: start;`}
`;

const Handle = styled.div<{ active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 12px;
  margin-right: 2px;
  margin-left: 2px;
  ${({ active }) =>
    active
      ? `background-color: var(${ThemeColorVariables.buttonForeground}); border: 1px solid var(${ThemeColorVariables.buttonForeground});`
      : `background-color: var(${ThemeColorVariables.border}); border: 1px solid var(${ThemeColorVariables.border});`}
`;
