import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";
import { ThemeColorVariables } from "@xliic/common/theme";

export const TabList = styled(Tabs.List)`
  display: flex;
  border-bottom: 1px solid var(${ThemeColorVariables.tabBorder});
  padding-left: 15px;
`;

export const TabButton = styled(Tabs.Trigger)`
  border: none;
  padding: 0.25rem 1rem;
  color: var(${ThemeColorVariables.tabInactiveForeground});
  background: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;

  &[data-state="active"] {
    color: var(${ThemeColorVariables.tabActiveForeground});
    border-bottom: 3px solid var(${ThemeColorVariables.buttonBackground});
    cursor: inherit;
  }
`;
