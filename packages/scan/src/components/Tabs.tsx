import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";
import { ThemeColorVariables } from "@xliic/common/theme";

export const TabList = styled(Tabs.List)`
  margin: 0.25rem;
  display: flex;
  :after {
    border-bottom: 1px solid var(${ThemeColorVariables.tabBorder});
    content: "";
    flex: 1;
  }
`;

export const TabButton = styled(Tabs.Trigger)`
  border-radius: 0.375rem 0.375rem 0 0;
  border: 1px solid var(${ThemeColorVariables.tabBorder});
  padding: 0.25rem 1rem;
  color: var(${ThemeColorVariables.tabInactiveForeground});
  background-color: var(${ThemeColorVariables.tabInactiveBackground});

  &[data-state="active"] {
    color: var(${ThemeColorVariables.tabActiveForeground});
    background-color: var(${ThemeColorVariables.tabActiveBackground});
    border-bottom: 1px transparent solid;
  }
`;
