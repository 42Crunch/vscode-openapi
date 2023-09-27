import * as Tabs from "@radix-ui/react-tabs";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import styled from "styled-components";

export function TabContainer({ tabs }: { tabs: Tab[] }) {
  const activeId = tabs.filter((tab) => !tab.disabled)?.[0]?.id;

  if (activeId === undefined) {
    return null;
  }

  const [activeTab, setActiveTab] = useState(activeId);

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <TabList>
        {tabs
          .filter((tab) => !tab.disabled)
          .map((tab) => (
            <TabButton key={tab.id} value={tab.id}>
              {tab.title}
            </TabButton>
          ))}
      </TabList>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id}>
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

export type Tab = {
  id: string;
  title: string;
  content: JSX.Element;
  disabled?: boolean;
};

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
