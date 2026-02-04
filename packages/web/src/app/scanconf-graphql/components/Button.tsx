import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

const Button = styled.button`
  cursor: pointer;
  background-color: var(${ThemeColorVariables.buttonBackground});
  color: var(${ThemeColorVariables.buttonForeground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  padding: 6px 16px;
  border-radius: 2px;
  &:focus {
    outline: 1px solid var(${ThemeColorVariables.focusBorder});
  }
`;

export default Button;
