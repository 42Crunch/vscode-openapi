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
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;

  &[data-state="active"] {
    color: var(${ThemeColorVariables.tabActiveForeground});
    border-bottom: 3px solid var(${ThemeColorVariables.buttonBackground});
    cursor: inherit;
  }
`;

export const RoundTabButton = styled(Tabs.Trigger)`
  border: none;
  border-radius: 8px;
  padding: 0.2rem 1rem;
  margin: 6px 6px;
  color: var(${ThemeColorVariables.tabInactiveForeground});
  background-color: var(${ThemeColorVariables.computedOne});
  //border-bottom: 3px solid transparent;
  cursor: pointer;
  position: relative;

  &[data-state="active"] {
    color: var(${ThemeColorVariables.tabActiveForeground});
    cursor: inherit;
  }

  &[data-state="active"]:before {
    border-bottom: 3px solid var(${ThemeColorVariables.buttonBackground});
    content: "";
    position: absolute;
    bottom: -6px;
    left: 0;
    right: 0;
    height: 3px;
  }
`;
