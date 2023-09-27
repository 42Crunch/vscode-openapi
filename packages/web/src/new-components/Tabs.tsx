import * as Tabs from "@radix-ui/react-tabs";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useEffect, useState } from "react";
import styled from "styled-components";

export function TabContainer({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: Tab[];
  activeTab?: string;
  setActiveTab?: (activeTab: string) => void;
}) {
  if (setActiveTab !== undefined && activeTab !== undefined) {
    return <ControlledTabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }
  return <UncontrolledTabContainer tabs={tabs} />;
}

export function UncontrolledTabContainer({ tabs }: { tabs: Tab[] }) {
  const activeId = tabs.filter((tab) => !tab.disabled)?.[0]?.id;

  if (activeId === undefined) {
    return null;
  }

  const [activeTab, setActiveTab] = useState(activeId);

  useEffect(() => {
    const activeId = tabs.filter((tab) => !tab.disabled)?.[0]?.id;
    setActiveTab(activeId);
  }, [tabs]);

  return <ControlledTabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

export function ControlledTabContainer({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (activeTab: string) => void;
}) {
  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <TabList>
        {tabs
          .filter((tab) => !tab.disabled)
          .map((tab) => (
            <TabButton key={tab.id} value={tab.id}>
              {tab.title}
              {renderCounter(tab)}
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

function renderCounter(tab: Tab) {
  if (!tab.counter) {
    return null;
  }

  return tab.counterKind === "error" ? (
    <ErrorCounter>{tab.counter}</ErrorCounter>
  ) : (
    <Counter>{tab.counter}</Counter>
  );
}

export type Tab = {
  id: string;
  title: string;
  content: JSX.Element;
  disabled?: boolean;
  counter?: number;
  counterKind?: "normal" | "error";
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

const Counter = styled.span`
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  padding: 2px 4px;
`;

const ErrorCounter = styled.span`
  background-color: var(${ThemeColorVariables.errorBackground});
  color: var(${ThemeColorVariables.errorForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  padding: 2px 4px;
`;
