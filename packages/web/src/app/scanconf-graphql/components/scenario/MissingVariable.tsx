import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { SquarePlus } from "../../../../icons";

export function MissingVariable({ name, append }: { name: string; append: any }) {
  return (
    <Container
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        append({ key: name, value: "", type: "string" }, { shouldFocus: true });
      }}
    >
      <span>{name}</span>
      <SquarePlus />
    </Container>
  );
}

const Container = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(${ThemeColorVariables.linkForeground});
  cursor: pointer;
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
