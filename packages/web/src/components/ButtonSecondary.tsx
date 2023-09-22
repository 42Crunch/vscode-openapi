import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

const ButtonSecondary = styled.button`
  cursor: pointer;
  background-color: var(${ThemeColorVariables.buttonSecondaryBackground});
  color: var(${ThemeColorVariables.buttonSecondaryForeground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  padding: 6px 16px;
  border-radius: 2px;
  &:focus {
    background-color: var(${ThemeColorVariables.buttonSecondaryHoverBackground});
  }
`;

export default ButtonSecondary;
